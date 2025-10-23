/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the Express application
 * Catches all errors and formats them consistently for the client
 * 
 * IMPORTANT: This must be registered AFTER all routes in server.ts
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

/**
 * Error response structure sent to client
 */
interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>; // For validation errors
    stack?: string; // Only in development
  };
}

/**
 * Main error handler middleware
 * 
 * Usage in server.ts:
 * app.use(errorHandler);
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
  });

  // Handle custom AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    // Include validation errors if present
    if ('errors' in err && err.errors) {
      //response.error.errors = err.errors;
      response.error.message = err.message;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const response = handlePrismaError(err);
    res.status(response.statusCode).json({ error: response });
    return;
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: {
        message: 'Invalid data provided',
        statusCode: 400,
      },
    });
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    error: {
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal server error',
      statusCode: 500,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(500).json(response);
}

/**
 * Handle Prisma-specific errors and convert to user-friendly messages
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  message: string;
  statusCode: number;
} {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || 'field';
      return {
        message: `A record with this ${field} already exists`,
        statusCode: 409,
      };

    case 'P2025':
      // Record not found
      return {
        message: 'Record not found',
        statusCode: 404,
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        message: 'Referenced record does not exist',
        statusCode: 400,
      };

    case 'P2014':
      // Invalid ID
      return {
        message: 'Invalid ID provided',
        statusCode: 400,
      };

    default:
      // Generic database error
      logger.error('Unhandled Prisma error', { code: error.code, message: error.message });
      return {
        message: 'Database error occurred',
        statusCode: 500,
      };
  }
}

/**
 * 404 Not Found handler for undefined routes
 * Should be registered BEFORE errorHandler in server.ts
 * 
 * Usage in server.ts:
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates need for try-catch in every route
 * 
 * Usage:
 * router.get('/grants', asyncHandler(async (req, res) => {
 *   const grants = await getGrants(req.userId);
 *   res.json(grants);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}