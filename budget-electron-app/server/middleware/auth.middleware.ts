// auth.middleware - checks session token

import { Request, Response, NextFunction } from 'express';
import { getUserIdFromToken } from '../utils/sessionManager';

//Extend Express Request to include userId
//allows use of req.userId in routes after authentication

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      token?: string;
    }
  }
}

//check if user is authenticated
export function authenticate(req: Request, res: Response, next: NextFunction) {
  //extract token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');

  //check if token exists and is valid
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  //attach userId and token to request for use in route handlers
  req.userId = userId;
  req.token = token;

  next();
}