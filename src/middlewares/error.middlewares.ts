import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Centralized error handling middleware.
 * Logs and formats all errors before sending a response.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isProd = process.env.NODE_ENV === 'production';

  const status = err.statusCode || 500;
  const message =
    err.message ||
    (status === 404 ? 'Resource Not Found' : 'Internal Server Error');

  const logMessage = `
  🚨 ERROR LOG
  ───────────────────────────────
  Method:   ${req.method}
  URL:      ${req.originalUrl}
  IP:       ${req.ip}
  Status:   ${status}
  Message:  ${message}
  User:     ${(req as any).user?.id || 'Unauthenticated'}
  Stack:    ${err.stack || 'N/A'}
  ───────────────────────────────
  `;

  logger.error(logMessage);

  if (!isProd) {
    console.error(logMessage);
  }

  const errorResponse: any = {
    success: false,
    status,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (!isProd) {
    errorResponse.stack = err.stack;
    errorResponse.method = req.method;
    errorResponse.ip = req.ip;
  }

  if (err.name === 'ValidationError') {
    errorResponse.type = 'ValidationError';
    errorResponse.errors = err.errors || [];
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.type = 'AuthenticationError';
    errorResponse.message = 'Invalid or expired token';
  } else if (err.name === 'CastError') {
    errorResponse.type = 'DatabaseCastError';
    errorResponse.message = 'Invalid database ID format';
  }

  res.status(status).json(errorResponse);
};
