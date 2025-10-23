/**
 * Spending Requests Routes
 * 
 * Extracted from your original server.ts
 * Handles /api/spending-requests/* endpoints - SAME LOGIC, just organized
 */

import { Router } from 'express';
import {
  createSpendingRequest,
  getUserSpendingRequests,
  getGrantSpendingRequests,
  getSpendingRequestDetails,
  addUserToSpendingRequest,
  addRuleFringeToRequest,
} from '../services/spending.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/spending-requests
 * Create a new spending request
 * (Same as your original code)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { grantId, amount, category, description, ruleIds, fringeRateIds } = req.body;
    const spendingRequest = await createSpendingRequest(
      { grantId, amount, category, description, ruleIds, fringeRateIds },
      req.userId!
    );
    res.json({ spendingRequest });
  } catch (error: any) {
    if (error.message === 'Access denied to this grant') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * GET /api/spending-requests
 * Get all spending requests for the authenticated user
 * (Same as your original code)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const requests = await getUserSpendingRequests(req.userId!);
    res.json({ requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/spending-requests/:id
 * Get detailed information about a specific spending request
 * (Same as your original code)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const spendingRequest = await getSpendingRequestDetails(requestId, req.userId!);
    res.json({ spendingRequest });
  } catch (error: any) {
    if (error.message === 'Access denied to this request') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * POST /api/spending-requests/:id/users
 * Add a user to an existing spending request
 * (Same as your original code)
 */
router.post('/:id/users', authenticate, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { userId, grantId, role } = req.body;
    const userGrantRequest = await addUserToSpendingRequest(
      requestId,
      userId,
      grantId,
      role,
      req.userId!
    );
    res.json({ userGrantRequest });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

/**
 * POST /api/spending-requests/:id/rules-fringes
 * Link rules and fringe rates to a spending request
 * (Same as your original code)
 */
router.post('/:id/rules-fringes', authenticate, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { ruleId, fringeRateId, appliedAmount, notes } = req.body;
    const requestRuleFringe = await addRuleFringeToRequest(
      requestId,
      ruleId,
      fringeRateId,
      appliedAmount,
      notes,
      req.userId!
    );
    res.json({ requestRuleFringe });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;