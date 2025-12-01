import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'; // true for 465
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

export async function sendVerificationEmail(to: string, code: string) {
  const transporter = createTransporter();
  const subject = 'Your verification code';
  const text = `Your verification code is ${code}. It expires in 5 minutes.`;
  const html = `<p>Your verification code is <b>${code}</b>. It expires in 5 minutes.</p>`;

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    logger.info(`[Mailer] verification email sent to ${to} messageId=${info.messageId}`);
    return info;
  } catch (err: any) {
    logger.error('[Mailer] error sending verification email', err);
    throw err;
  }
}
