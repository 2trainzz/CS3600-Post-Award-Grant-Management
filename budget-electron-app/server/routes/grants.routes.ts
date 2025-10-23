//grants.routes

import { Router } from 'express';
import { getUserGrants, getGrantDetails } from '../services/grants.service';
import { getGrantSpendingRequests } from '../services/spending.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

//GET /api/grants -get all grants for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const grants = await getUserGrants(req.userId!);
    res.json({ grants });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//GET /api/grants/:id -get detailed information about a specific grant
router.get('/:id', authenticate, async (req, res) => {
  try {
    const grantId = parseInt(req.params.id);
    const grant = await getGrantDetails(grantId, req.userId!);
    res.json({ grant });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      res.status(403).json({ error: error.message });
    } else if (error.message === 'Grant not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

//GET /api/grants/:id/spending-requests -get all spending requests for a specific grant
router.get('/:id/spending-requests', authenticate, async (req, res) => {
  try {
    const grantId = parseInt(req.params.id);
    const requests = await getGrantSpendingRequests(grantId, req.userId!);
    res.json({ requests });
  } catch (error: any) {
    if (error.message === 'Access denied') {
      res.status(403).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;