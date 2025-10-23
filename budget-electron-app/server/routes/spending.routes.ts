//spending.routes

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

//POST /api/spending-requests -create a new spending request
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

//GET /api/spending-requests -get all spending requests for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const requests = await getUserSpendingRequests(req.userId!);
    res.json({ requests });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//GET /api/spending-requests/:id -get detailed information about a specific spending request
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

//POST /api/spending-requests/:id/users -add a user to an existing spending request
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

//POST /api/spending-requests/:id/rules-fringes -link rules and fringe rates to a spending request
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