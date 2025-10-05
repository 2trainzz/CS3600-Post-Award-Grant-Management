import express from 'express';
//import bcrypt from 'bcrypt';
//import prisma from './prisma';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

//beginner code to show electron works
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.get('/api/data', (_req, res) => {
  res.json({ 
    data: ['Yippee!', 'It works', 'For this!'],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/*
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

/*
// Get applicable rules for a grant
app.get('/api/grants/:id/rules', authenticate, async (req: any, res) => {
  try {
    const grantId = parseInt(req.params.id);
    
    // Check access
    const userGrant = await prisma.userGrant.findFirst({
      where: {
        userId: req.userId,
        grantId
      }
    });
    
    if (!userGrant) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get rules for this grant and global rules
    const rules = await prisma.rule.findMany({
      where: {
        OR: [
          { grantId },
          { grantId: null }
        ],
        isActive: true
      }
    });
    
    res.json({ rules });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get applicable fringe rates for a grant
app.get('/api/grants/:id/fringe-rates', authenticate, async (req: any, res) => {
  try {
    const grantId = parseInt(req.params.id);
    
    // Check access
    const userGrant = await prisma.userGrant.findFirst({
      where: {
        userId: req.userId,
        grantId
      }
    });
    
    if (!userGrant) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get fringe rates for this grant and default rates
    const now = new Date();
    const fringeRates = await prisma.fringeRate.findMany({
      where: {
        OR: [
          { grantId },
          { grantId: null }
        ],
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now }}
        ]
      }
    });
     
    res.json({ fringeRates });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/
