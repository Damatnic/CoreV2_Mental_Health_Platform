import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Logger configuration
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Custom error classes for different error types
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, true, 'RATE_LIMIT_ERROR', { retryAfter });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, false, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(`External service error: ${service}`, 502, false, 'EXTERNAL_SERVICE_ERROR', originalError);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    id: string;
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    method?: string;
    details?: any;
  };
}

/**
 * Development error handler - includes stack trace
 */
const developmentErrorHandler = (
  error: AppError,
  req: Request,
  res: Response
): void => {
  const errorResponse: ErrorResponse = {
    error: {
      id: uuidv4(),
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      details: error.details
    }
  };

  // Add stack trace in development
  (errorResponse.error as any).stack = error.stack;

  logger.error('Development Error', {
    ...errorResponse.error,
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: sanitizeHeaders(req.headers),
    user: req.user?.id
  });

  res.status(error.statusCode).json(errorResponse);
};

/**
 * Production error handler - sanitized responses
 */
const productionErrorHandler = (
  error: AppError,
  req: Request,
  res: Response
): void => {
  // Don't leak error details in production
  const errorResponse: ErrorResponse = {
    error: {
      id: uuidv4(),
      code: error.code || 'INTERNAL_ERROR',
      message: error.isOperational ? error.message : 'An error occurred processing your request',
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Only include safe details in production
  if (error.isOperational && error.details) {
    errorResponse.error.details = sanitizeErrorDetails(error.details);
  }

  logger.error('Production Error', {
    id: errorResponse.error.id,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
    user: req.user?.id,
    ip: req.ip,
    details: error.details
  });

  res.status(error.statusCode).json(errorResponse);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(err);
  }

  let error: AppError;

  // Convert regular errors to AppError
  if (!(err instanceof AppError)) {
    // Handle specific error types
    if (err.name === 'ValidationError') {
      error = new ValidationError(err.message);
    } else if (err.name === 'CastError') {
      error = new ValidationError('Invalid ID format');
    } else if (err.name === 'JsonWebTokenError') {
      error = new AuthenticationError('Invalid token');
    } else if (err.name === 'TokenExpiredError') {
      error = new AuthenticationError('Token expired');
    } else if (err.name === 'SequelizeValidationError') {
      error = new ValidationError('Database validation failed', err);
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      error = new ConflictError('Resource already exists');
    } else {
      // Default to internal server error
      error = new AppError(
        err.message || 'Internal server error',
        500,
        false,
        'INTERNAL_ERROR'
      );
    }
  } else {
    error = err;
  }

  // Use appropriate handler based on environment
  if (process.env.NODE_ENV === 'development') {
    developmentErrorHandler(error, req, res);
  } else {
    productionErrorHandler(error, req, res);
  }
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

/**
 * Sanitize headers for logging
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize error details for production
 */
function sanitizeErrorDetails(details: any): any {
  if (!details) return undefined;
  
  if (typeof details === 'string') {
    return details;
  }
  
  if (Array.isArray(details)) {
    return details.map(item => sanitizeErrorDetails(item));
  }
  
  if (typeof details === 'object') {
    const sanitized: any = {};
    const allowedKeys = ['field', 'value', 'message', 'code', 'expected', 'received'];
    
    for (const key of allowedKeys) {
      if (details[key] !== undefined) {
        sanitized[key] = details[key];
      }
    }
    
    return sanitized;
  }
  
  return undefined;
}

/**
 * Unhandled rejection handler
 */
export const unhandledRejectionHandler = (
  reason: any,
  promise: Promise<any>
): void => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });

  // In production, you might want to gracefully shutdown
  if (process.env.NODE_ENV === 'production') {
    // Send alert to monitoring service
    // Gracefully close connections
    // Exit process
  }
};

/**
 * Uncaught exception handler
 */
export const uncaughtExceptionHandler = (error: Error): void => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });

  // In production, exit process after logging
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

/**
 * Validation error formatter for express-validator
 */
export const validationErrorFormatter = (errors: any[]): ErrorResponse => {
  const formattedErrors = errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value,
    location: error.location
  }));

  return {
    error: {
      id: uuidv4(),
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      details: formattedErrors
    }
  };
};

/**
 * Database connection error handler
 */
export const databaseErrorHandler = (error: any): void => {
  logger.error('Database Connection Error', {
    code: error.code,
    message: error.message,
    stack: error.stack
  });

  // Implement retry logic or fallback
  if (error.code === 'ECONNREFUSED') {
    logger.error('Database connection refused - check if database is running');
  } else if (error.code === 'ETIMEDOUT') {
    logger.error('Database connection timeout - check network connectivity');
  }
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (signal: string): void => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Close database connections
  // Close server
  // Clean up resources
  
  setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  validationErrorFormatter,
  databaseErrorHandler,
  gracefulShutdown,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
};