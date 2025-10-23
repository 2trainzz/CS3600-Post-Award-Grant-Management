/**
 * Grants Routes
 * 
 * Endpoints:
 * - GET /api/grants - Get user's grants
 * - GET /api/grants/:id - Get grant details
 * - POST /api/grants - Create new grant (admin only)
 * - GET /api/grants/:id/rules - Get applicable rules
 * - GET /api/grants/:id/fringe-rates - Get applicable fringe rates
 * - POST /api/grants/:id/users - Add user to grant
 */

import { Router } from 'express';
import {
  getUserGrants,
  getGrantDetails,
  createGrant,
  getAllRules,
  getAllFringeRates,
  addUserToGrant,
} from '../services/grants.service';
import { 
  authenticate, 
  requireRole 
} from '../middleware/auth.middleware';
import {
  validateIdParam,
  validateCreateGrant,
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';

const router = Router();

/**
 * GET /api/grants
 * Get all grants the authenticated user has access to
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { grants: [...] }
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const grants = await getUserGrants(req.userId!);
    res.json({ grants });
  })
);

/**
 * GET /api/grants/:id
 * Get detailed information about a specific grant
 * 
 * Headers: Authorization: Bearer <token>
 * Params: id - Grant ID
 * Returns: { grant: {...} }
 */
router.get(
  '/:id',
  authenticate,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const grant = await getGrantDetails(
      parseInt(req.params.id),
      req.userId!
    );
    res.json({ grant });
  })
);

/**
 * POST /api/grants
 * Create a new grant (admin only)
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { grantNumber, grantName, totalAmount, studentBalance, travelBalance, startDate, endDate, description }
 * Returns: { grant: {...} }
 */
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validateCreateGrant,
  asyncHandler(async (req, res) => {
    const grant = await createGrant(req.body, req.userId!);
    res.status(201).json({ grant });
  })
);

/**
 * GET /api/grants/rules
 * Get all available rules (global)
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { rules: [...] }
 */
router.get(
  '/rules/all',
  authenticate,
  asyncHandler(async (req, res) => {
    const rules = await getAllRules();
    res.json({ rules });
  })
);

/**
 * GET /api/grants/fringe-rates
 * Get all available fringe rates
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { fringeRates: [...] }
 */
router.get(
  '/fringe-rates/all',
  authenticate,
  asyncHandler(async (req, res) => {
    const fringeRates = await getAllFringeRates();
    res.json({ fringeRates });
  })
);

/**
 * POST /api/grants/:id/users
 * Add a user to a grant (owner/admin only)
 * 
 * Headers: Authorization: Bearer <token>
 * Params: id - Grant ID
 * Body: { userId, role }
 * Returns: { userGrant: {...} }
 */
router.post(
  '/:id/users',
  authenticate,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const userGrant = await addUserToGrant(
      parseInt(req.params.id),
      userId,
      role,
      req.userId!
    );
    res.status(201).json({ userGrant });
  })
);

export default router;