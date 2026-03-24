import { Request, Response, NextFunction, Application } from 'express';

interface ErrorResponse {
  status: string;
  message: string;
  timestamp: string;
  stack?: string;
  path?: string;
  method?: string;
}

// Custom error class for known errors
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  console.error('[ErrorHandler] Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Ensure content type is set to JSON
  res.setHeader('Content-Type', 'application/json');

  // Handle rate limit errors
  if (err.message?.includes('rate limit')) {
    const retryAfter = parseInt(err.message.split(':')[1]) || 60;
    res.status(429).json({
      status: 'error',
      message: 'Rate limit exceeded',
      retryAfter,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle authentication errors
  if (err.message?.includes('unauthorized') || err.message?.includes('invalid token')) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle validation errors
  if (err.message?.includes('validation')) {
    res.status(400).json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error response
  const errorResponse: ErrorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.path = req.path;
    errorResponse.method = req.method;
  }

  // Use statusCode from AppError if available, otherwise default to 500
  const statusCode = (err as AppError).statusCode || 500;
  res.status(statusCode).json(errorResponse);
};

export const setupErrorHandling = (app: Application): void => {
  // Ensure JSON responses
  app.use((req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Handle 404 errors
  app.use((req: Request, res: Response): void => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use(errorHandler);
};