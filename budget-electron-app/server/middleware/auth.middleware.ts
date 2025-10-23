/**
 * Authentication Middleware
 * 
 * Extracted from your original server.ts
 * Checks session token - SAME LOGIC, just organized
 */

import { Request, Response, NextFunction } from 'express';
import { getUserIdFromToken } from '../utils/sessionManager';

/**
 * Extend Express Request to include userId
 * This lets us use req.userId in routes after authentication
 */
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      token?: string;
    }
  }
}

/**
 * Middleware to check if user is authenticated
 * (Exact same logic as your original authenticate function)
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Extract token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Check if token exists and is valid
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Attach userId and token to request for use in route handlers
  req.userId = userId;
  req.token = token;

  next();
}