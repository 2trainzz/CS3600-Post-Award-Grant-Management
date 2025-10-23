/**
 * Request Validation Middleware
 * 
 * Validates incoming request data using Zod schemas
 * Ensures type safety and provides clear validation errors
 * 
 * NOTE: Install Zod first: npm install zod
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Generic validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and parse the request body
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for the client
        const formattedErrors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });
        
        next(new ValidationError('Validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });
        next(new ValidationError('Query validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validation middleware for URL parameters
 */
export function validateParams(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(err.message);
        });
        next(new ValidationError('Parameter validation failed', formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Login request validation
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Registration request validation
 */
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  
  email: z.string()
    .email('Invalid email format'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
});

/**
 * Spending request creation validation
 */
export const createSpendingRequestSchema = z.object({
  grantId: z.number()
    .int('Grant ID must be an integer')
    .positive('Grant ID must be positive'),
  
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be a valid number'),
  
  category: z.enum(['travel', 'students'], {
    errorMap: () => ({ message: 'Category must be either "travel" or "students"' }),
  }),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  
  ruleIds: z.array(z.number()).optional(),
  fringeRateIds: z.array(z.number()).optional(),
});

/**
 * AI parse request validation
 */
export const aiParseSchema = z.object({
  grantId: z.number()
    .int('Grant ID must be an integer')
    .positive('Grant ID must be positive'),
  
  userMessage: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
});

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: z.string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'ID must be a positive integer',
    }),
});

/**
 * Grant creation validation (for admin routes)
 */
export const createGrantSchema = z.object({
  grantNumber: z.string()
    .min(1, 'Grant number is required')
    .max(50, 'Grant number must be less than 50 characters'),
  
  grantName: z.string()
    .min(1, 'Grant name is required')
    .max(200, 'Grant name must be less than 200 characters'),
  
  totalAmount: z.number()
    .positive('Total amount must be positive'),
  
  studentBalance: z.number()
    .nonnegative('Student balance cannot be negative'),
  
  travelBalance: z.number()
    .nonnegative('Travel balance cannot be negative'),
  
  startDate: z.string()
    .datetime('Invalid start date format'),
  
  endDate: z.string()
    .datetime('Invalid end date format'),
  
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
}).refine(
  (data) => {
    // Ensure studentBalance + travelBalance doesn't exceed totalAmount
    return (data.studentBalance + data.travelBalance) <= data.totalAmount;
  },
  {
    message: 'Student balance + Travel balance cannot exceed total amount',
    path: ['studentBalance'],
  }
).refine(
  (data) => {
    // Ensure endDate is after startDate
    return new Date(data.endDate) > new Date(data.startDate);
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

// Export convenience validators
export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
export const validateCreateSpendingRequest = validate(createSpendingRequestSchema);
export const validateAiParse = validate(aiParseSchema);
export const validateIdParam = validateParams(idParamSchema);
export const validateCreateGrant = validate(createGrantSchema);