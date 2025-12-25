import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import logger from './logger';
import { Request } from 'express';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '10d';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'refreshsecretkey';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface JWTPayload extends JwtPayload {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  userId?: string;
  isEmailVerified?: boolean;
  profileCompleted?: boolean;
}


export const generateAccessToken = (payload: JWTPayload): string => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);
    logger.info(`Access token generated for user: ${payload.id}`);
    return token;
  } catch (error: any) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  try {
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);
    logger.info(`Refresh token generated for user: ${payload.id}`);
    return refreshToken;
  } catch (error: any) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Access token expired');
      throw new Error('Access token expired');
    }
    logger.error('Invalid access token');
    throw new Error('Invalid access token');
  }
};


export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch (error: any) {
    logger.error('Invalid or expired refresh token');
    throw new Error('Invalid or expired refresh token');
  }
};


export const extractTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or malformed Authorization header');
    return null;
  }
  const token = authHeader.split(' ')[1];
  return token;
};


export const validateAuthHeader = (req: Request): JWTPayload => {
  const token = extractTokenFromHeader(req);
  if (!token) {
    throw new Error('Authorization token missing');
  }
  const decoded = verifyAccessToken(token);
  logger.info(`Authenticated request from user: ${decoded.id}`);
  return decoded;
};
