//ai.service - handles Google Gemini AI parsing

import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../prisma';
import { logger } from '../utils/logger';
import { checkGrantAccess } from './grants.service';
import { getAllRules, getAllFringeRates } from './rules.service';

//init Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

//parse a natural language spending request using AI
export async function parseSpendingRequest(
  userMessage: string,
  grantId: number,
  userId: number
) {
  logger.info('AI parsing spending request', { userId, grantId });

  //check if user has access to the grant
  const hasAccess = await checkGrantAccess(grantId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to this grant');
  }

  //get grant details
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
  });

  if (!grant) {
    throw new Error('Grant not found');
  }

  //get applicable rules
  const rules = await getAllRules();

  //get applicable fringe rates
  const fringeRates = await getAllFringeRates();

  //build context prompt for Gemini
  const context = `
You are a grant management assistant. Parse the user's spending request and extract structured information.

GRANT INFORMATION:
- Grant Name: ${grant.grantName}
- Grant Number: ${grant.grantNumber}
- Total Budget: $${grant.totalAmount}
- Remaining Budget: $${grant.remainingAmount}
- Student Balance: $${grant.studentBalance}
- Travel Balance: $${grant.travelBalance}

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

  try {
    //call gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(context);
    const responseText = result.response.text();

    logger.debug('AI response received', { responseLength: responseText.length });

    //parse JSON response
    let parsedData;
    try {
      //remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      logger.error('Failed to parse AI response', { error: parseError });
      throw new Error('Failed to parse AI response');
    }

    //add grant context for frontend
    parsedData.grant = {
      id: grant.id,
      name: grant.grantName,
      number: grant.grantNumber,
    };

    logger.info('AI parsing successful', { 
      category: parsedData.category,
      amount: parsedData.amount 
    });

    return parsedData;

  } catch (error: any) {
    logger.error('AI service error', { error: error.message });
    throw new Error('AI service error: ' + error.message);
  }
}