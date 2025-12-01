import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import logger from '../utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction): Response | void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: ValidationError) => ({
      field: err.param,
      message: err.msg,
      value: err.value,
      location: err.location,
    }));

    logger.warn(`
    ⚠️ Validation Failed
    ───────────────────────────────
    Method:   ${req.method}
    URL:      ${req.originalUrl}
    IP:       ${req.ip}
    Errors:   ${JSON.stringify(formattedErrors, null, 2)}
    `);

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  next();
};
