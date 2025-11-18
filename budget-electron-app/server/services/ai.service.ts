//ai.service - handles AI parsing with Groq

import Groq from 'groq-sdk';
import prisma from '../prisma';
import { logger } from '../utils/logger';
import { checkGrantAccess } from './grants.service';
import { getAllRules, getAllFringeRates } from './rules.service';

//init Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

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

  //build context prompt
  const systemPrompt = `You are a grant management assistant. Parse the user's spending request and extract structured information.

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

TASK:
Extract the following information and return ONLY valid JSON (no markdown, no explanation):
{
  "category": "travel" or "students" (determine from context),
  "amount": numeric amount in dollars,
  "description": clear description of the expense,
  "suggestedRules": [array of rule IDs that apply],
  "suggestedFringeRates": [array of fringe rate IDs that apply],
  "warnings": [array of any policy violations or concerns],
  "confidence": number between 0-1 indicating parsing confidence,
  "preApprovalRecommendation": "approved" or "needs_review" or "rejected",
  "preApprovalReasoning": "explain why you recommend approval, review, or rejection based on budget and rules"
}

IMPORTANT: For preApprovalRecommendation:
- Use "approved" if: amount is within budget, follows all rules, no policy violations, and confidence > 0.8
- Use "needs_review" if: uncertain about rules, moderate concerns, or confidence between 0.5-0.8
- Use "rejected" if: exceeds budget, clear policy violations, or confidence < 0.5

If the request is unclear or missing information, include it in warnings.`;

  try {
    //call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      model: 'llama-3.3-70b-versatile', // Fast and accurate
      temperature: 0.1,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || '';
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

    //validate required fields
    if (!parsedData.category || !parsedData.amount || !parsedData.description) {
      logger.error('AI response missing required fields', { parsedData });
      throw new Error('Could not extract all required information. Please provide more details about the category, amount, and description.');
    }

    //validate category is one of the allowed values

    if (parsedData.category !== 'travel' && parsedData.category !== 'student') {
      logger.error('Invalid category from AI', { category: parsedData.category });
      throw new Error('Could not determine if this is a travel or student expense. Please be more specific.');
    }
  

    //validate amount is a positive number
    const amount = parseFloat(parsedData.amount);
    if (isNaN(amount) || amount <= 0) {
      logger.error('Invalid amount from AI', { amount: parsedData.amount });
      throw new Error('Could not determine a valid dollar amount. Please specify how much you need.');
    }

    //ensure amount is properly formatted
    parsedData.amount = amount;

    //validate and process AI pre-approval recommendation
    if (!parsedData.preApprovalRecommendation) {
      parsedData.preApprovalRecommendation = 'needs_review';
      parsedData.preApprovalReasoning = 'AI did not provide a recommendation';
    }

    //double-check AI recommendation against actual budget
    const relevantBalance = parsedData.category === 'travel' ? parseFloat(grant.travelBalance.toString()) : parseFloat(grant.studentBalance.toString());
    
    if (amount > relevantBalance && parsedData.preApprovalRecommendation === 'approved') {
      logger.warn('AI approved request that exceeds budget, overriding to needs_review', {
        amount,
        balance: relevantBalance,
        category: parsedData.category
      });
      parsedData.preApprovalRecommendation = 'needs_review';
      parsedData.preApprovalReasoning = `Amount (${amount}) exceeds available ${parsedData.category} balance (${relevantBalance}). Requires admin review.`;
      parsedData.warnings = parsedData.warnings || [];
      parsedData.warnings.push(`Exceeds ${parsedData.category} budget by ${(amount - relevantBalance).toFixed(2)}`);
    }

    //add pre-approval status for display
    parsedData.preApprovalStatus = {
      recommendation: parsedData.preApprovalRecommendation,
      reasoning: parsedData.preApprovalReasoning,
      requiresHumanReview: true, // All requests still need human verification
    };

    //add grant context for frontend
    parsedData.grant = {
      id: grant.id,
      name: grant.grantName,
      number: grant.grantNumber,
    };

    logger.info('AI parsing successful', {
      category: parsedData.category,
      amount: parsedData.amount,
    });

    return parsedData;
  } catch (error: any) {
    logger.error('AI service error', { error: error.message });
    throw new Error('AI service error: ' + error.message);
  }
}