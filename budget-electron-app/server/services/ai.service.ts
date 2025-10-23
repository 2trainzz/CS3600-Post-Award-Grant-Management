/**
 * AI Service
 * 
 * Handles Google Gemini AI integration for parsing spending requests
 * Converts natural language into structured spending request data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../prisma';
import { 
  ServiceUnavailableError, 
  BadRequestError 
} from '../utils/errors';
import { logger } from '../utils/logger';
import { verifyGrantAccess } from './grants.service';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Parsed data structure returned by AI
 */
interface AiParsedData {
  category: 'travel' | 'students';
  amount: number;
  description: string;
  suggestedRules: number[];
  suggestedFringeRates: number[];
  warnings: string[];
  confidence: number;
  grant?: {
    id: number;
    name: string;
    number: string;
  };
}

/**
 * Parse a natural language spending request using AI
 * 
 * @param userMessage - User's natural language request
 * @param grantId - Grant ID for context
 * @param userId - User ID
 * @returns Structured spending request data
 */
export async function parseSpendingRequest(
  userMessage: string,
  grantId: number,
  userId: number
): Promise<AiParsedData> {
  logger.info('AI parsing spending request', { 
    userId, 
    grantId, 
    messageLength: userMessage.length 
  });

  // Verify user has access to the grant
  await verifyGrantAccess(grantId, userId);

  // Fetch grant details for context
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
  });

  if (!grant) {
    throw new BadRequestError('Grant not found');
  }

  // Fetch applicable rules for context
  const rules = await prisma.rule.findMany();

  // Fetch fringe rates for context
  const fringeRates = await prisma.fringeRate.findMany();

  // Build context prompt for Gemini
  const context = buildAiPrompt(userMessage, grant, rules, fringeRates);

  try {
    // Call Gemini API
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });
    
    const result = await model.generateContent(context);
    const responseText = result.response.text();

    logger.debug('AI response received', { 
      responseLength: responseText.length 
    });

    // Parse JSON response
    let parsedData: AiParsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      logger.error('Failed to parse AI response', { 
        error: parseError,
        responseText 
      });
      
      throw new ServiceUnavailableError(
        'Failed to parse AI response. Please try rephrasing your request.'
      );
    }

    // Add grant context for frontend
    parsedData.grant = {
      id: grant.id,
      name: grant.grantName,
      number: grant.grantNumber,
    };

    logger.info('AI parsing successful', { 
      category: parsedData.category,
      amount: parsedData.amount,
      confidence: parsedData.confidence 
    });

    return parsedData;

  } catch (error: any) {
    logger.error('AI service error', { error: error.message });

    if (error instanceof ServiceUnavailableError) {
      throw error;
    }

    throw new ServiceUnavailableError(
      'AI service is temporarily unavailable. Please try again or use manual entry.'
    );
  }
}

/**
 * Build the AI prompt with grant context and rules
 */
function buildAiPrompt(
  userMessage: string,
  grant: any,
  rules: any[],
  fringeRates: any[]
): string {
  return `
You are a grant management assistant. Parse the user's spending request and extract structured information.

GRANT INFORMATION:
- Grant Name: ${grant.grantName}
- Grant Number: ${grant.grantNumber}
- Total Budget: $${grant.totalAmount}
- Remaining Budget: $${grant.remainingAmount}
- Student Balance: $${grant.studentBalance}
- Travel Balance: $${grant.travelBalance}
- Grant Period: ${grant.startDate} to ${grant.endDate}

APPLICABLE RULES:
${rules.map((r, idx) => `${idx}. [ID: ${r.id}] ${r.ruleType}: ${r.description} (Policy: ${r.policyHolder})`).join('\n')}

FRINGE RATES:
${fringeRates.map((f, idx) => `${idx}. [ID: ${f.id}] ${f.description}: ${f.rate}%`).join('\n')}

USER REQUEST:
"${userMessage}"

TASK:
Analyze the user's request and extract the following information. Return ONLY valid JSON with no markdown formatting, no code blocks, and no additional explanation:

{
  "category": "travel" OR "students" (determine from context),
  "amount": numeric amount in dollars (extract the dollar amount),
  "description": clear, professional description of the expense (rewrite user's request clearly),
  "suggestedRules": [array of rule IDs that apply based on the request],
  "suggestedFringeRates": [array of fringe rate IDs that should be applied],
  "warnings": [array of any policy violations, concerns, or missing information],
  "confidence": number between 0 and 1 indicating parsing confidence
}

IMPORTANT RULES:
1. category must be EXACTLY "travel" or "students" - determine this from keywords in the request
2. amount must be a number - extract from text like "$2500" or "2,500 dollars"
3. description should be professional and clear - rewrite the user's text if needed
4. suggestedRules should include IDs of rules that apply to this request type
5. suggestedFringeRates should include IDs of fringe rates that apply
6. warnings should flag any issues like:
   - Amount exceeds available balance
   - Missing required information
   - Potential policy violations
   - Needs additional approvals
7. confidence should reflect how certain you are about the parsing (0.0 to 1.0)

Return ONLY the JSON object, with no additional text or formatting.
`.trim();
}

/**
 * Get AI suggestions for improving a spending request description
 * Optional feature for helping users write better descriptions
 * 
 * @param description - Current description
 * @param category - Request category
 * @returns Improved description suggestions
 */
export async function suggestDescriptionImprovement(
  description: string,
  category: string
): Promise<string[]> {
  logger.debug('Getting AI description suggestions', { category });

  const prompt = `
You are a grant management assistant. Improve the following spending request description to be more professional and detailed.

Category: ${category}
Current Description: "${description}"

Provide 3 alternative descriptions that are:
1. More professional and formal
2. Include relevant details
3. Appropriate for grant documentation

Return ONLY a JSON array of strings with no additional text:
["suggestion 1", "suggestion 2", "suggestion 3"]
`.trim();

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json\n?|\n?```/g, '')
      .trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    logger.error('Failed to get description suggestions', { error });
    // Return empty array on error - this is optional feature
    return [];
  }
}