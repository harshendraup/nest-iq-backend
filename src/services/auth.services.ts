import UserModel from '../models/user.models';
import {
  storeEmailCode,
  verifyEmailCode,
  storeMobileCode,
  verifyMobileCode
} from '../services/otpVerify.services';

import { sendVerificationEmail } from '../services/email.services';
import { generateAccessToken } from '../utils/jwt';
import { entityIdGenerator } from "../utils/index"
import logger from '../utils/logger';

/* ------------ EMAIL OTP SEND ------------ */
export async function requestEmailLoginCode(email: string) {
  const { code } = await storeEmailCode(email, 300);
  await sendVerificationEmail(email, code);
  return { success: true, code: code };
}

/* ------------ MOBILE OTP SEND (FREE) ------------ */
export async function requestMobileLoginCode(mobile: string) {
  const { code } = await storeMobileCode(mobile, 300);

  // FREE METHOD → Print OTP to console instead of sending SMS
  logger.info(`[OTP][DEV] Mobile OTP sent (fake SMS): ${mobile} => ${code}`);

  return { success: true, code: code };
}

export async function verifyEmailLoginCode(email: string, code: string, role?: string) {
  await verifyEmailCode(email, code);

  return completeLogin(email, undefined, role);
}

export async function verifyMobileLoginCode(mobile: string, code: string, role?: string) {
  await verifyMobileCode(mobile, code);

  return completeLogin(undefined, mobile, role);
}

export async function completeLogin(email?: string, mobile?: string, role?: string) {
  let user = await UserModel.findOne({ $or: [{ email }, { mobile }] }).lean();
  const userId = entityIdGenerator("user");

  if (!user) {
    const created = await UserModel.create({
      email: email || "",
      mobileNumber: mobile,
      userId: userId,
      name: "Unnamed User",
      isEmailVerified: !!email,
      isMobileVerified: !!mobile,
      password: Math.random().toString(36).slice(2, 12)
    });

    user = created.toObject();
  }

  const payload = {
    id: user._id,
    email: user.email,
    userId: user.userId,
    mobileNumber: user.mobileNumber,
    name: user.name,
    role: user.role || "user"
  };

  const token = generateAccessToken(payload);

  return { token, user };
}
