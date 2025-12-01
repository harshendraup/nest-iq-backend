import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import logger from '../utils/logger';


export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      logger.warn(`❌ Missing token | IP: ${req.ip} | Route: ${req.originalUrl}`);
      res.status(401).json({
        success: false,
        message: 'Authorization token is missing. Please login again.',
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    (req as any).user = decoded;

    logger.info(`✅ Authenticated | UserID: ${decoded.id} | Role: ${decoded.role || 'N/A'} | Path: ${req.originalUrl}`);
    next();

  } catch (error: any) {
    const errorMessage =
      error.message === 'Access token expired'
        ? 'Session expired. Please login again.'
        : 'Invalid or malformed token.';

    logger.error(
      `🔴 Authentication failed | Error: ${error.message} | IP: ${req.ip} | Route: ${req.originalUrl}`
    );

    res.status(401).json({
      success: false,
      message: errorMessage,
    });
  }
};


export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      logger.warn(`⚠️ Unauthorized access attempt | Route: ${req.originalUrl}`);
      res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in first.',
      });
      return;
    }

    if (!roles.includes(user.role)) {
      logger.warn(`⛔ Forbidden | User: ${user.id} tried to access ${req.originalUrl}`);
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
};
