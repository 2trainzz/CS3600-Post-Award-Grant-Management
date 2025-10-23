/**
 * AI Routes
 * 
 * Endpoints:
 * - POST /api/ai/parse-spending-request - Parse natural language request
 * - POST /api/ai/suggest-description - Get description suggestions
 */

import { Router } from 'express';
import {
  parseSpendingRequest,
  suggestDescriptionImprovement,
} from '../services/ai.service';
import { authenticate } from '../middleware/auth.middleware';
//import { validateAiParse } from '../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/ai/parse-spending-request
 * Parse a natural language spending request using AI
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { grantId, userMessage }
 * Returns: { parsed: { category, amount, description, suggestedRules, suggestedFringeRates, warnings, confidence, grant } }
 * 
 * Example request:
 * {
 *   "grantId": 1,
 *   "userMessage": "I need $2500 for travel to the ACM conference in Seattle next month"
 * }
 */
router.post('/parse-spending-request', authenticate, async (req, res) => {
    const { grantId, userMessage } = req.body;
    const parsed = await parseSpendingRequest(
      userMessage,
      grantId,
      req.userId!
    );
    res.json({ parsed });
});

/**
 * POST /api/ai/suggest-description
 * Get AI suggestions for improving a description
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { description, category }
 * Returns: { suggestions: ["...", "...", "..."] }
 */
router.post('/suggest-description', authenticate, async (req, res) => {
    const { description, category } = req.body;
    const suggestions = await suggestDescriptionImprovement(
      description,
      category
    );
    res.json({ suggestions });
});

export default router;