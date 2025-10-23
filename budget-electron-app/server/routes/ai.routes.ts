/**
 * AI Routes
 * 
 * Endpoints:
 * - POST /api/ai/parse-spending-request - Parse natural language request
 * - POST /api/ai/suggest-description - Get description suggestions
 */

import { Router } from 'express';
import { parseSpendingRequest } from '../services/ai.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/ai/parse-spending-request
 * Parse a natural language spending request using AI
 * (Same as your original /api/spending-requests/ai-parse route)
 * 
 * Note: The endpoint path changed from /api/spending-requests/ai-parse
 * to /api/ai/parse-spending-request for better organization
 */
router.post('/parse-spending-request', authenticate, async (req, res) => {
  try {
    const { userMessage, grantId } = req.body;

    if (!userMessage || !grantId) {
      return res.status(400).json({ error: 'Missing userMessage or grantId' });
    }

    const parsed = await parseSpendingRequest(
      userMessage,
      parseInt(grantId),
      req.userId!
    );

    res.json({ parsed });
  } catch (error: any) {
    if (error.message === 'Access denied to this grant') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Grant not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;