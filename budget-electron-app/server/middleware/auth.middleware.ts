/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches user info to the request
 * Replaces the old in-memory session system with stateless JWT authentication
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import prisma from '../prisma';

/**
 * Main authentication middleware
 * Verifies JWT token and attaches userId to request
 * 
 * Usage in routes:
 * router.get('/protected', authenticate, async (req, res) => {
 *   console.log(req.userId); // Available after authentication
 * });
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // Verify and decode the token
    const payload = verifyToken(token);
    
    // Attach user ID to request for use in route handlers
    req.userId = payload.userId;
    req.token = token;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authentication middleware that also loads full user object
 * Use this when you need complete user information in the route
 * 
 * Usage:
 * router.get('/profile', authenticateWithUser, async (req, res) => {
 *   console.log(req.user); // Full user object available
 * });
 */
export async function authenticateWithUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // First run standard authentication
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.token = token;
    
    // Fetch full user object from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        // Explicitly exclude password
      },
    });
    
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based authorization middleware
 * Checks if authenticated user has one of the required roles
 * 
 * Usage:
 * router.delete('/grants/:id', authenticate, requireRole(['admin']), async (req, res) => {
 *   // Only admins can access this route
 * });
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated first
      if (!req.userId) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Fetch user's role
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true },
      });
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      
      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 * Useful for routes that have different behavior for authenticated users
 * 
 * Usage:
 * router.get('/public', optionalAuth, async (req, res) => {
 *   if (req.userId) {
 *     // Show personalized content
 *   } else {
 *     // Show public content
 *   }
 * });
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      try {
        const payload = verifyToken(token);
        req.userId = payload.userId;
        req.token = token;
      } catch {
        // Token is invalid, but that's okay for optional auth
        // Just continue without setting userId
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}