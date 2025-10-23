/**
 * Authentication Routes
 * 
 * Extracted from your original server.ts
 * Handles /api/auth/* endpoints - SAME LOGIC, just organized
 */

import { Router } from 'express';
import { register, login, logout } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * (Same as your original code)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const result = await register({ username, password, email, firstName, lastName });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login and get session token
 * (Same as your original code)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login({ username, password });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout (delete session)
 * (Same as your original code)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    if (req.token) {
      await logout(req.token);
    }
    res.json({ message: 'Logged out' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;