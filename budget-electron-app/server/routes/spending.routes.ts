/**
 * Spending Request Routes
 * 
 * Endpoints:
 * - POST /api/spending-requests - Create new spending request
 * - GET /api/spending-requests - Get user's spending requests
 * - GET /api/spending-requests/:id - Get specific spending request
 * - PUT /api/spending-requests/:id/status - Update request status
 * - POST /api/spending-requests/:id/rules-fringes - Add rules/rates
 * - GET /api/grants/:id/spending-requests - Get grant's spending requests
 */

import { Router } from 'express';
import {
  createSpendingRequest,
  getUserSpendingRequests,
  getGrantSpendingRequests,
  getSpendingRequestDetails,
  updateSpendingRequestStatus,
  addRuleFringeToRequest,
} from '../services/spending.service';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateIdParam,
  validateCreateSpendingRequest,
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';

const router = Router();

/**
 * POST /api/spending-requests
 * Create a new spending request
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { grantId, amount, category, description, ruleIds?, fringeRateIds? }
 * Returns: { spendingRequest: {...} }
 */
router.post(
  '/',
  authenticate,
  validateCreateSpendingRequest,
  asyncHandler(async (req, res) => {
    const spendingRequest = await createSpendingRequest(
      req.body,
      req.userId!
    );
    res.status(201).json({ spendingRequest });
  })
);

/**
 * GET /api/spending-requests
 * Get all spending requests for the authenticated user
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { requests: [...] }
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const requests = await getUserSpendingRequests(req.userId!);
    res.json({ requests });
  })
);

/**
 * GET /api/spending-requests/:id
 * Get detailed information about a specific spending request
 * 
 * Headers: Authorization: Bearer <token>
 * Params: id - Spending request ID
 * Returns: { spendingRequest: {...} }
 */
router.get(
  '/:id',
  authenticate,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const spendingRequest = await getSpendingRequestDetails(
      parseInt(req.params.id),
      req.userId!
    );
    res.json({ spendingRequest });
  })
);

/**
 * PUT /api/spending-requests/:id/status
 * Update spending request status (approve/reject)
 * Only grant owners/admins can do this
 * 
 * Headers: Authorization: Bearer <token>
 * Params: id - Spending request ID
 * Body: { status, reviewNotes? }
 * Returns: { spendingRequest: {...} }
 */
router.put(
  '/:id/status',
  authenticate,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { status, reviewNotes } = req.body;
    const spendingRequest = await updateSpendingRequestStatus(
      parseInt(req.params.id),
      status,
      reviewNotes,
      req.userId!
    );
    res.json({ spendingRequest });
  })
);

/**
 * POST /api/spending-requests/:id/rules-fringes
 * Add rules and fringe rates to a spending request
 * 
 * Headers: Authorization: Bearer <token>
 * Params: id - Spending request ID
 * Body: { ruleId, fringeRateId, appliedAmount?, notes? }
 * Returns: { requestRuleFringe: {...} }
 */
router.post(
  '/:id/rules-fringes',
  authenticate,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { ruleId, fringeRateId, appliedAmount, notes } = req.body;
    const requestRuleFringe = await addRuleFringeToRequest(
      parseInt(req.params.id),
      ruleId,
      fringeRateId,
      appliedAmount,
      notes,
      req.userId!
    );
    res.status(201).json({ requestRuleFringe });
  })
);

export default router;