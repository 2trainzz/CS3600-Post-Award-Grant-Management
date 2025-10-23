//NOT IN USE
/**
 * Custom Error Classes
 * 
 * These provide structured error handling with HTTP status codes
 * Makes it easy to throw specific errors that the error handler middleware
 * can format consistently for the client
 */

//Base class for application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for instanceof checks to work
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request - Invalid input from client
 * Usage: throw new BadRequestError('Invalid email format');
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 * Usage: throw new UnauthorizedError('Invalid credentials');
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 * Usage: throw new ForbiddenError('Access denied to this grant');
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 * Usage: throw new NotFoundError('Grant not found');
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 * Usage: throw new ConflictError('Username already taken');
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 * Usage: throw new ValidationError('Amount must be positive');
 */
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 422);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 * Usage: throw new InternalServerError('Database connection failed');
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable - External service unavailable
 * Usage: throw new ServiceUnavailableError('AI service is down');
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(message, 503);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}