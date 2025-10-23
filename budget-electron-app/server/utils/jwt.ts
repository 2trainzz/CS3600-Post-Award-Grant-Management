/**
 * JWT Token Utilities
 * 
 * Provides functions for creating and verifying JWT tokens
 * This replaces the in-memory session system with stateless JWT authentication
 * 
 * NOTE: You'll need to install 'jsonwebtoken' package:
 * npm install jsonwebtoken @types/jsonwebtoken
 */

import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors';

// JWT secret from environment variable (REQUIRED in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days default

/**
 * Payload structure for JWT tokens
 */
export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

/**
 * Generate a JWT token for a user
 * 
 * @param payload - User information to encode in the token
 * @returns Signed JWT token string
 * 
 * Usage:
 * const token = generateToken({ userId: 1, username: 'admin', role: 'admin' });
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'grant-management-system',
  });
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token string to verify
 * @returns Decoded payload if valid
 * @throws UnauthorizedError if token is invalid or expired
 * 
 * Usage:
 * try {
 *   const payload = verifyToken(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   // Token is invalid
 * }
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'grant-management-system',
    }) as JwtPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    } else {
      throw new UnauthorizedError('Token verification failed');
    }
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @returns Token string without "Bearer " prefix, or null if not found
 * 
 * Usage:
 * const token = extractToken(req.headers.authorization);
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }
  
  // Check if it starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract the token part
  const token = authHeader.substring(7); // Remove "Bearer "
  
  return token || null;
}

/**
 * Decode token without verifying (useful for debugging)
 * WARNING: Don't use this for authentication!
 * 
 * @param token - JWT token string
 * @returns Decoded payload (unverified)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}