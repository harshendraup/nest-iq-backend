import { randomInt } from 'crypto';
import AuthCodeModel from '../models//authCode.models';
import logger from '../utils/logger';

export function generateNumericCode(digits = 6) {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(randomInt(min, max + 1));
}

export async function storeEmailCode(email: string, ttlSeconds = 300) {
  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await AuthCodeModel.deleteMany({ target: email, type: 'email_code' });

  const doc = await AuthCodeModel.create({
    target: email,
    code,
    type: 'email_code',
    expiresAt
  });

  logger.info(`[OTP] stored code for ${email} expiresAt=${expiresAt.toISOString()}`);
  return { code, doc };
}

// mobile otp store function
export async function storeMobileCode(mobile: string, ttlSeconds = 300) {
  const code = generateNumericCode(6);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await AuthCodeModel.deleteMany({ target: mobile, type: 'mobile_code' });

  const doc = await AuthCodeModel.create({
    target: mobile,
    code,
    type: 'mobile_code',
    expiresAt
  });

  logger.info(`[OTP] MOBILE OTP for ${mobile}: ${code}`);

  return { code, doc };
}

/**
 * Verify code. Returns true + deletes code on success.
 * Throws on failure.
 */
export async function verifyEmailCode(email: string, code: string) {
  const rec = await AuthCodeModel.findOne({ target: email, code, type: 'email_code' });
  if (!rec) {
    const maybe = await AuthCodeModel.findOne({ target: email, type: 'email_code' });
    if (maybe) {
      maybe.attempts = (maybe.attempts || 0) + 1;
      await maybe.save();
    }
    throw new Error('Invalid or expired code');
  }

  await AuthCodeModel.deleteMany({ target: email, type: 'email_code' });
  return true;
}

export async function verifyMobileCode(mobile: string, code: string) {
  const rec = await AuthCodeModel.findOne({ target: mobile, code, type: 'mobile_code' });

  if (!rec) throw new Error('Invalid or expired mobile code');

  await AuthCodeModel.deleteMany({ target: mobile, type: 'mobile_code' });
  return true;
}
