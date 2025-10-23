/**
 * Type extensions for Express Request object
 * 
 * This file extends the Express Request interface to include custom properties
 * that we add via middleware (like userId and user from authentication)
 */

import { User } from '@prisma/client';

declare global {
  namespace Express {
     //Extend the Request interface to include authenticated user info
    interface Request {
       //User ID from JWT token (set by auth middleware)
      userId?: number;
      
        //Full user object (optionally populated by auth middleware)
      user?: Omit<User, 'password'>;
      
      //JWT token from Authorization header (for logout)
      token?: string;
    }
  }
}

/**
 * Export an empty object to make this a module
 * Required for the global namespace augmentation to work
 */
export {};