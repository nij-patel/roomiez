import { Request, Response, NextFunction } from 'express';
import { logAPI, logSystem } from '../utils/logger';

/**
 * Custom Error Classes
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Error Response Interface
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  stack?: string;
  details?: any;
}

/**
 * Development Error Response
 * Includes stack trace and full error details
 */
const sendErrorDev = (err: any, req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    error: err.name || 'Error',
    message: err.message || 'Something went wrong',
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    stack: err.stack,
    details: err.details || null
  };

  logAPI.error(req.method, req.path, `${err.name}: ${err.message}`);

  res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * Production Error Response
 * Sanitized error response without sensitive information
 */
const sendErrorProd = (err: any, req: Request, res: Response): void => {
  // Only send error details for operational errors
  if (err.isOperational) {
    const errorResponse: ErrorResponse = {
      error: err.name || 'Error',
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    logAPI.error(req.method, req.path, `${err.name}: ${err.message}`);
    res.status(err.statusCode).json(errorResponse);
  } else {
    // Programming or unknown error: don't leak error details
    logSystem.error('Unknown Error', `${err.name}: ${err.message}\nStack: ${err.stack}`);
    
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Handle specific Firebase errors
 */
const handleFirebaseError = (err: any): AppError => {
  if (err.code === 'permission-denied') {
    return new AuthorizationError('Access denied to this resource');
  }
  
  if (err.code === 'not-found') {
    return new NotFoundError('Requested resource not found');
  }
  
  if (err.code === 'already-exists') {
    return new ConflictError('Resource already exists');
  }
  
  if (err.code === 'invalid-argument') {
    return new ValidationError('Invalid data provided');
  }

  // Default Firebase error
  return new AppError('Database operation failed', 500);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError => {
  return new AuthenticationError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = (): AppError => {
  return new AuthenticationError('Your token has expired. Please log in again.');
};

/**
 * Handle validation errors from Zod
 */
const handleZodError = (err: any): AppError => {
  const message = err.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation failed';
  return new ValidationError(message);
};

/**
 * Global Error Handling Middleware
 * This should be the last middleware in your app
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  // Firebase errors
  if (err.code && err.code.includes('firebase')) {
    error = handleFirebaseError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    error = handleZodError(err);
  }

  // Mongoose/MongoDB errors (if you ever switch to MongoDB)
  if (err.name === 'CastError') {
    error = new ValidationError('Invalid ID format');
  }
  
  if (err.code === 11000) {
    error = new ConflictError('Duplicate field value');
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Catch-all for unhandled routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(err);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}; 