import express from 'express';
import bcrypt from 'bcrypt';
import prisma from './prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import grantsRoutes from './routes/grants.routes';

const app = express();
const PORT = process.env.PORT || 3001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/grants', grantsRoutes);

 //claude
// Simple session storage (in production, use proper session management)
const sessions = new Map<string, number>(); // token -> userId

// Helper function to generate simple token
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware to check authentication
function authenticate(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.userId = sessions.get(token);
  next();
}
//LLM stuff
// AI-powered request parsing
app.post('/api/spending-requests/ai-parse', authenticate, async (req: any, res) => {
  try {
    const { userMessage, grantId } = req.body;
    
    if (!userMessage || !grantId) {
      return res.status(400).json({ error: 'Missing userMessage or grantId' });
    }
    
    // Check if user has access to this grant
    const userGrant = await prisma.userGrant.findFirst({
      where: {
        userId: req.userId,
        grantId: parseInt(grantId)
      }
    });
    
    if (!userGrant) {
      return res.status(403).json({ error: 'Access denied to this grant' });
    }
    
    // Fetch grant details
    const grant = await prisma.grant.findUnique({
      where: { id: parseInt(grantId) }
    });
    
    // Get applicable rules
    const rules = await prisma.rule.findMany({
      where: {
        //OR: [
        //  { grantId: parseInt(grantId) },
        //  { grantId: null }
        //],
        //isActive: true
      }
    });
    
    // Get applicable fringe rates
    const fringeRates = await prisma.fringeRate.findMany({
      where: {
        //OR: [
        //  { grantId: parseInt(grantId) },
        //  { grantId: null }
        //]
      }
    });
    
    // Build context for Gemini
    const context = `
You are a grant management assistant. Parse the user's spending request and extract structured information.

GRANT INFORMATION:
- Grant Name: ${grant?.grantName}
- Grant Number: ${grant?.grantNumber}
- Total Budget: $${grant?.totalAmount}
- Remaining Budget: $${grant?.remainingAmount}
- Student Balance: $${grant?.studentBalance}
- Travel Balance: $${grant?.travelBalance}

APPLICABLE RULES:
${rules.map(r => `- ${r.ruleType}: ${r.description} (Policy: ${r.policyHolder})`).join('\n')}

FRINGE RATES:
${fringeRates.map(f => `- ${f.description}: ${f.rate}%`).join('\n')}

USER REQUEST:
"${userMessage}"

TASK:
Extract the following information and return ONLY valid JSON (no markdown, no explanation):
{
  "category": "travel" or "students" (determine from context),
  "amount": numeric amount in dollars,
  "description": clear description of the expense,
  "suggestedRules": [array of rule IDs that apply],
  "suggestedFringeRates": [array of fringe rate IDs that apply],
  "warnings": [array of any policy violations or concerns],
  "confidence": number between 0-1 indicating parsing confidence
}

If the request is unclear or missing information, include it in warnings.
`;

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(context);
    const responseText = result.response.text();
    
    // Parse JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        rawResponse: responseText 
      });
    }
    
    // Add grant context for frontend
    parsedData.grant = {
      id: grant?.id,
      name: grant?.grantName,
      number: grant?.grantNumber
    };
    
    res.json({ parsed: parsedData });
    
  } catch (error: any) {
    console.error('AI parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse request' });
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken();
    sessions.set(token, user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/logout', authenticate, (req: any, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }
  res.json({ message: 'Logged out' });
});

// Get user's grants
app.get('/api/grants', authenticate, async (req: any, res) => {
  try {
    const userGrants = await prisma.userGrant.findMany({
      where: { userId: req.userId },
      include: {
        grant: true
      }
    });
    
    res.json({ grants: userGrants.map(ug => ug.grant) });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get grant details
app.get('/api/grants/:id', authenticate, async (req: any, res) => {
  try {
    const grantId = parseInt(req.params.id);
    
    // Check if user has access to this grant
    const userGrant = await prisma.userGrant.findFirst({
      where: {
        userId: req.userId,
        grantId
      }
    });
    
    if (!userGrant) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      
      //include: {
      //  rules: true,
      //  fringeRates: true
      //} 
    });
    
    res.json({ grant });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create spending request
app.post('/api/spending-requests', authenticate, async (req: any, res) => {
  try {
    const { grantId, amount, category, description, ruleIds, fringeRateIds } = req.body;
    
    // Check if user has access to this grant
    const userGrant = await prisma.userGrant.findFirst({
      where: {
        userId: req.userId,
        grantId
      }
    });
    
    if (!userGrant) {
      return res.status(403).json({ error: 'Access denied to this grant' });
    }
    
    // Create spending request and link user/grant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the spending request
      const spendingRequest = await tx.spendingRequest.create({
        data: {
          amount,
          category,
          description
        }
      });
      
      // Link user, grant, and spending request
      await tx.userGrantRequest.create({
        data: {
          userId: req.userId,
          grantId,
          spendingRequestId: spendingRequest.id,
          role: 'creator'
        }
      });
      
      // Link rules and fringe rates if provided
      if (ruleIds && fringeRateIds && ruleIds.length > 0 && fringeRateIds.length > 0) {
        // Create entries for each rule-fringe combination
        for (const ruleId of ruleIds) {
          for (const fringeRateId of fringeRateIds) {
            await tx.requestRuleFringe.create({
              data: {
                spendingRequestId: spendingRequest.id,
                ruleId,
                fringeRateId
              }
            });
          }
        }
      }
      
      return spendingRequest;
    });
    
    res.json({ spendingRequest: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's spending requests
app.get('/api/spending-requests', authenticate, async (req: any, res) => {
  try {
    // Find all spending requests where user is involved
    const userGrantRequests = await prisma.userGrantRequest.findMany({
      where: { userId: req.userId },
      include: {
        spendingRequest: {
          include: {
            requestRuleFringes: {
              include: {
                rule: true,
                fringeRate: true
              }
            }
          }
        },
        grant: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Transform data for easier frontend consumption
    const requests = userGrantRequests.map(ugr => ({
      ...ugr.spendingRequest,
      grant: ugr.grant,
      userRole: ugr.role,
      users: [ugr.user] // Could expand this to show all users involved
    }));
    
    res.json({ requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get spending requests for a grant (for reviewers/admins)
app.get('/api/grants/:id/spending-requests', authenticate, async (req: any, res) => {
  try {
    const grantId = parseInt(req.params.id);
    
    // Check if user has access to this grant
    const userGrant = await prisma.userGrant.findFirst({
      where: {
        userId: req.userId,
        grantId
      }
    });
    
    if (!userGrant) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Find all spending requests for this grant
    const userGrantRequests = await prisma.userGrantRequest.findMany({
      where: { grantId },
      include: {
        spendingRequest: {
          include: {
            requestRuleFringes: {
              include: {
                rule: true,
                fringeRate: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group by spending request to show all users involved
    const requestMap = new Map();
    
    for (const ugr of userGrantRequests) {
      const requestId = ugr.spendingRequest.id;
      if (!requestMap.has(requestId)) {
        requestMap.set(requestId, {
          ...ugr.spendingRequest,
          users: []
        });
      }
      requestMap.get(requestId).users.push({
        ...ugr.user,
        role: ugr.role
      });
    }
    
    const requests = Array.from(requestMap.values());
    
    res.json({ requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific spending request with all details
app.get('/api/spending-requests/:id', authenticate, async (req: any, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // Check if user has access to this spending request
    const userGrantRequest = await prisma.userGrantRequest.findFirst({
      where: {
        userId: req.userId,
        spendingRequestId: requestId
      }
    });
    
    if (!userGrantRequest) {
      return res.status(403).json({ error: 'Access denied to this request' });
    }
    
    // Get full spending request details
    const spendingRequest = await prisma.spendingRequest.findUnique({
      where: { id: requestId },
      include: {
        userGrantRequests: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            grant: true
          }
        },
        requestRuleFringes: {
          include: {
            rule: true,
            fringeRate: true
          }
        }
      }
    });
    
    res.json({ spendingRequest });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add user to existing spending request (e.g., add an approver)
app.post('/api/spending-requests/:id/users', authenticate, async (req: any, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { userId, grantId, role } = req.body;
    
    // Check if current user has access to this request
    const existingAccess = await prisma.userGrantRequest.findFirst({
      where: {
        userId: req.userId,
        spendingRequestId: requestId
      }
    });
    
    if (!existingAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Add new user to the spending request
    const userGrantRequest = await prisma.userGrantRequest.create({
      data: {
        userId,
        grantId,
        spendingRequestId: requestId,
        role: role || 'reviewer'
      }
    });
    
    res.json({ userGrantRequest });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Link rules and fringe rates to a spending request
app.post('/api/spending-requests/:id/rules-fringes', authenticate, async (req: any, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { ruleId, fringeRateId, appliedAmount, notes } = req.body;
    
    // Check if user has access to this request
    const userGrantRequest = await prisma.userGrantRequest.findFirst({
      where: {
        userId: req.userId,
        spendingRequestId: requestId
      }
    });
    
    if (!userGrantRequest) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const requestRuleFringe = await prisma.requestRuleFringe.create({
      data: {
        spendingRequestId: requestId,
        ruleId,
        fringeRateId,
        appliedAmount,
        notes
      }
    });
    
    res.json({ requestRuleFringe });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});