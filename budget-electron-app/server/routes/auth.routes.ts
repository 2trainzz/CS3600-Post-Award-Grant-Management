/**
 * Authentication Routes
 * 
 * Endpoints:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login and get token
 * - POST /api/auth/logout - Logout (optional for JWT)
 * - GET /api/auth/profile - Get current user profile
 * - PUT /api/auth/password - Change password
 */

import { Router } from 'express';
import { 
  register, 
  login, 
  getUserProfile,
  changePassword 
} from '../services/auth.service';

import { authenticate } from '../middleware/auth.middleware';
import { 
  validateLogin, 
  validateRegister 
} from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/errorHandler.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Body: { username, password, email, firstName, lastName }
 * Returns: { token, user }
 */
router.post(
  '/register',
  validateRegister,
  asyncHandler(async (req, res) => {
    const result = await register(req.body);
    res.status(201).json(result);
  })
);

/**
 * POST /api/auth/login
 * Authenticate user and receive JWT token
 * 
 * Body: { username, password }
 * Returns: { token, user }
 */
router.post(
  '/login',
  validateLogin,
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.json(result);
  })
);

/**
 * POST /api/auth/logout
 * Logout user (for JWT, this is mainly client-side)
 * Server can optionally maintain a blacklist
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { message }
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    // For JWT, logout is handled client-side by removing the token
    // Optionally implement token blacklist here if needed
    res.json({ message: 'Logged out successfully' });
  })
);

/**
 * GET /api/auth/profile
 * Get current user's profile
 * 
 * Headers: Authorization: Bearer <token>
 * Returns: { user }
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getUserProfile(req.userId!);
    res.json({ user });
  })
);

/**
 * PUT /api/auth/password
 * Change user password
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword }
 * Returns: { message }
 */
router.put(
  '/password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await changePassword(req.userId!, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  })
);

export default router;