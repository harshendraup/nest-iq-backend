import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    mobileNumber?: string;
    userId?: string;
    googleEmail?: string;


    role: 'user' | 'admin' | 'broker';

    profileCompleted?: boolean;
    profileImage?: string;
    dob?: Date;
    gender?: string;
    status?: 'active' | 'inactive' | 'suspended';

    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };

    preferences?: {
        propertyType?: string[];          // flat, villa, plot, commercial
        budgetMin?: number;
        budgetMax?: number;
        preferredCities?: string[];
        bedrooms?: number[];
        amenities?: string[];
        furnishing?: string[];
    };

    // --- SEARCH HISTORY ---
    searchHistory?: {
        query: string;
        city?: string;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        date: Date;
    }[];

    savedProperties?: string[];           // property IDs
    viewedProperties?: {
        propertyId: string;
        viewedAt: Date;
    }[];

    activityLogs?: {
        action: string;                   // "login", "viewProperty", "bookVisit", "updateProfile", etc.
        propertyId?: string;              // optional
        device?: string;                  // browser info
        ip?: string;
        timestamp: Date;
    }[];

    visitBookings?: {
        propertyId: string;
        scheduledDate: Date;
        status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    }[];

    isMobileVerified?: boolean;
    isEmailVerified?: boolean;
    kyc?: {
        adhaarNumber?: string;
        panNumber?: string;
        verified?: boolean;
    };

    // --- DEVICE SESSION TRACKING ---
    sessions?: {
        device: string;
        ip: string;
        loggedInAt: Date;
        loggedOutAt?: Date;
    }[];

    notifications?: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    
    email: { type: String,  unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    mobileNumber: { type: String },
    userId: { type: String, unique: true },
    googleEmail: { type: String },

    role: { type: String, enum: ['user', 'admin', 'agent'], default: 'user' },

    profileCompleted: { type: Boolean, default: false },
    profileImage: { type: String },
    dob: { type: Date },
    gender: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },

    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    preferences: {
        propertyType: [String],
        budgetMin: Number,
        budgetMax: Number,
        preferredCities: [String],
        bedrooms: [Number],
        amenities: [String],
        furnishing: [String]
    },

    searchHistory: [
        {
            query: String,
            city: String,
            minPrice: Number,
            maxPrice: Number,
            bedrooms: Number,
            date: { type: Date, default: Date.now }
        }
    ],

    savedProperties: [{ type: String }],

    viewedProperties: [
        {
            propertyId: String,
            viewedAt: { type: Date, default: Date.now }
        }
    ],

    activityLogs: [
        {
            action: String,
            propertyId: String,
            device: String,
            ip: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],

    visitBookings: [
        {
            propertyId: String,
            scheduledDate: Date,
            status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'] }
        }
    ],

    isMobileVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    kyc: {
        adhaarNumber: String,
        panNumber: String,
        verified: { type: Boolean, default: false }
    },

    sessions: [
        {
            device: String,
            ip: String,
            loggedInAt: Date,
            loggedOutAt: Date
        }
    ],

    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
    }

}, { timestamps: true });

export default model<IUser>('User', UserSchema);




// // controllers/authController.js
// import bcrypt from 'bcryptjs';
// import CryptoJS from 'crypto-js';
// import fetch from 'node-fetch'; // if you use node v18+, native fetch exists
// import _ from 'lodash';
// import { toObjectId } from '../utils/mongo'; // your helper
// import Users from '../models/Users';
// import SubUsers from '../models/SubUsers';
// import { sendVerificationEmail } from '../utils/mailer';
// import redis from '../utils/redis'; // your redis wrapper with get/set/del
// import auth from '../services/auth'; // auth.createToken, auth.decodetoken
// import authHelpers from './authHelpers'; // we'll mention generateOTP here
// import Utils from '../utils/response';
// import config from '../config';
// import CustomError from '../errors/CustomError';
// import {
//   ERROR_RESPONSE,
//   ROLE,
//   ACCOUNT_STATUS,
//   ACTIVITY_LOGS_TAG,
//   WORKFLOW_STATUS,
//   DEFAULT_LNG
// } from '../constants';
// import userService from '../services/userService';

// const DEFAULT_OTP = config.DEFAULT_OTP || '5555';
// const MAX_LOGIN_ATTEMPTS = config.MAX_LOGIN_ATTEMPTS || 5;

// /**
//  * Helper to increment login attempts
//  */
// async function incrementLoginAttempts(userId) {
//   if (!userId) return;
//   await Users.updateOne({ _id: toObjectId(userId) }, { $inc: { loginAttempts: 1 } });
// }

// /**
//  * Email + password login
//  */
// export async function loginWithEmail(req, res) {
//   try {
//     const lang = req.headers.lang || DEFAULT_LNG;
//     const creds = { ...req.body };

//     if (!creds.email || creds.email.indexOf('@') === -1) {
//       throw new CustomError(400, ERROR_RESPONSE.INVALID_EMAIL_ADDRESS[lang]);
//     }

//     creds.email = creds.email.toLowerCase();

//     const doc = await Users.findOne(
//       { 'data.email': creds.email, 'data.role': ROLE.ADMIN },
//       {
//         password: 1,
//         mobileNumber: 1,
//         status: 1,
//         lastLoggedIn: 1,
//         data: { $elemMatch: { email: creds.email } },
//         defaultPasswordChangedRequired: 1,
//         type: 1,
//         loginAttempts: 1,
//         fullName: 1,
//         _id: 1
//       }
//     ).lean();

//     if (!doc) {
//       throw new CustomError(400, ERROR_RESPONSE.ACCOUNT_NOT_FOUND_BY_EMAIL[lang]);
//     }

//     if (doc.data && doc.data[0] && doc.data[0].status !== 'Active') {
//       throw new CustomError(401, ERROR_RESPONSE.ACCOUNT_SUSPENDED[lang]);
//     }

//     // Decrypt client-sent AES-encrypted password (you did this in original)
//     if (!creds.password) {
//       throw new CustomError(400, ERROR_RESPONSE.INVALID_PAYLOAD[lang] || 'Password missing');
//     }
//     const decryptedPassword = CryptoJS.AES.decrypt(creds.password, config.CRYPT_SEC).toString(CryptoJS.enc.Utf8);

//     if (!doc.password) {
//       throw new CustomError(400, ERROR_RESPONSE.PASSWORD_NOT_UPDATED[lang]);
//     }

//     if (doc.loginAttempts > MAX_LOGIN_ATTEMPTS) {
//       throw new CustomError(400, ERROR_RESPONSE.REACHED_UNSUCCESSFUL_ATTEMPTS[lang]);
//     }

//     const match = bcrypt.compareSync(decryptedPassword, doc.password);
//     if (!match) {
//       await incrementLoginAttempts(doc._id);
//       throw new CustomError(400, ERROR_RESPONSE.INCORRECT_PASSWOED[lang]);
//     }

//     if (doc.status === ACCOUNT_STATUS.BLOCKED) {
//       if (doc.active) throw new CustomError(400, ERROR_RESPONSE.INVALID_EMAIL_AND_PASSWORD[lang]);
//       else throw new CustomError(400, ERROR_RESPONSE.ACCOUNT_INACTIVE[lang]);
//     }

//     // SUBUSER check
//     let subUserDetail;
//     if (doc.data && doc.data[0] && doc.data[0].role === ROLE.SUBUSER) {
//       subUserDetail = await SubUsers.findOne({ userId: doc.data[0].userId }).lean();
//     }

//     // ADMIN & SUPER_ADMIN OTP flow (same as your original)
//     if (doc.data && doc.data[0] && doc.data[0].role === ROLE.ADMIN && doc.data[0].accountType === ROLE.SUPER_ADMIN) {
//       const getOTP = await redis.get(doc.mobileNumber);
//       if (getOTP && !creds.motp) {
//         return Utils.sendResponse(res, { otpLength: config.OTP_LENGTH, error: ERROR_RESPONSE.OTP_WAIT_TIME[lang] }, 200, 'success', '');
//       }

//       if (creds.motp && creds.motp.length > 0 && getOTP) {
//         const sessionIDFromClient = req.headers['sessionid'];
//         if (!sessionIDFromClient) throw new CustomError(400, 'Session ID is missing');

//         const sessionKey = `${doc.mobileNumber}:session`;
//         const sessionData = await redis.get(sessionKey);
//         const session = sessionData ? JSON.parse(sessionData) : null;
//         if (!session || session?.sessionId !== sessionIDFromClient) {
//           throw new CustomError(400, ERROR_RESPONSE.INVALID_SESSION[lang]);
//         }
//         if (getOTP !== creds.motp) {
//           throw new CustomError(400, ERROR_RESPONSE.OTP_INVALID[lang]);
//         }
//         // OTP passed -> continue to create token below
//       } else {
//         // send OTP
//         req.body.mobileNumber = doc.mobileNumber;
//         delete req.body.email;
//         req.body.returnOtp = true;
//         const gotp = await authHelpers.generateOTP(req, res); // should set redis and session
//         return Utils.sendResponse(res, gotp, 200, 'success');
//       }
//     }

//     // build claim data
//     const claimData = {
//       mobileNumber: doc.mobileNumber,
//       email: creds.email,
//       fullName: doc.fullName,
//       role: doc.data[0].role ? doc.data[0].role : '',
//       userId: doc.data[0].userId,
//       smeId: doc.data[0].smeId,
//       accountType: doc.data[0].accountType,
//       parentRole: doc.data[0].role
//     };
//     if (subUserDetail) claimData.parentRole = subUserDetail.parentRole;

//     const token = await auth.createToken(claimData);

//     await Users.updateOne({ _id: toObjectId(doc._id) }, { $set: { loginAttempts: 0 } });

//     // secure cookie (same as your original)
//     res.cookie('XSRF-TOKEN', token.sessionToken, {
//       httpOnly: false,
//       secure: true,
//       sameSite: 'None'
//     });
//     res.setHeader('X-Csrf-Token', token.sessionToken);

//     Utils.sendResponse(res, { accessToken: token.authToken, defaultPasswordChangedRequired: !!doc.defaultPasswordChangedRequired }, 200, 'success');

//     // async logging
//     const decodeToken = await auth.decodetoken(token.authToken);
//     decodeToken.loginType = 'Email';
//     await userService.createLoginHistory(req, decodeToken);

//     if (decodeToken.smeId) {
//       const activityLogs = {
//         userId: decodeToken.userId,
//         heading: `log in on ${decodeToken.source}`,
//         details: `${decodeToken.fullName} successfully logged in at ${new Date()}`,
//         tag: ACTIVITY_LOGS_TAG.LOGIN,
//         smeId: decodeToken.smeId,
//         status: WORKFLOW_STATUS.ACTIVE,
//         mobileNumber: decodeToken.mobileNumber,
//         fullName: decodeToken.fullName,
//         source: decodeToken.source
//       };
//       if (!_.isEmpty(activityLogs)) {
//         await userService.saveLogs(activityLogs);
//       }
//     }

//     return;
//   } catch (e) {
//     console.error(e);
//     return Utils.sendResponse(res, e, e.statusCode ? e.statusCode : 500, 'failure', e.message);
//   }
// }

// /**
//  * Verify Google id_token and login / register user
//  */
// export async function loginWithGoogle(req, res) {
//   try {
//     const lang = req.headers.lang || DEFAULT_LNG;
//     const { idToken, returnOtp } = req.body;

//     if (!idToken) throw new CustomError(400, ERROR_RESPONSE.INVALID_PAYLOAD[lang] || 'idToken missing');

//     // Verify idToken using Google tokeninfo endpoint or google-auth-library.
//     // Using Google's tokeninfo endpoint (avoid storing google secret on server). In production, prefer google-auth-library.
//     // Example endpoint: https://oauth2.googleapis.com/tokeninfo?id_token=<ID_TOKEN>
//     const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
//     const tokenResp = await fetch(tokenInfoUrl);
//     if (!tokenResp.ok) throw new CustomError(400, ERROR_RESPONSE.INVALID_GOOGLE_TOKEN[lang] || 'Invalid Google token');
//     const tokenPayload = await tokenResp.json();

//     // tokenPayload will contain email, email_verified, name, picture, sub (subject - google id)
//     const email = (tokenPayload.email || '').toLowerCase();
//     const emailVerified = tokenPayload.email_verified === 'true' || tokenPayload.email_verified === true;
//     const googleId = tokenPayload.sub;

//     if (!email || !emailVerified) {
//       throw new CustomError(400, ERROR_RESPONSE.GOOGLE_EMAIL_NOT_VERIFIED[lang] || 'Google email not verified');
//     }

//     // Find existing user (admin role criteria preserved - adapt as needed)
//     let user = await Users.findOne({ 'data.email': email }).lean();
//     if (!user) {
//       // Optionally create user record if your platform auto-registers Google users
//       // create minimal user
//       const created = await Users.create({
//         fullName: tokenPayload.name || '',
//         profileImage: tokenPayload.picture,
//         // store google id in data array similar to your model
//         data: [{
//           email,
//           role: ROLE.USER,
//           userId: `u_${Date.now()}`, // generate userId or use your generator
//           provider: 'google',
//           providerId: googleId,
//           status: 'Active'
//         }]
//       });
//       user = created.toObject();
//     }

//     // If you need OTP for some admin accounts (like in email flow)
//     if (user.data && user.data[0] && user.data[0].role === ROLE.ADMIN && user.data[0].accountType === ROLE.SUPER_ADMIN) {
//       const getOTP = await redis.get(user.mobileNumber);
//       if (getOTP && !req.body.motp) {
//         return Utils.sendResponse(res, { otpLength: config.OTP_LENGTH, error: ERROR_RESPONSE.OTP_WAIT_TIME[lang] }, 200, 'success', '');
//       }
//       if (req.body.motp && getOTP) {
//         const sessionIDFromClient = req.headers['sessionid'];
//         if (!sessionIDFromClient) throw new CustomError(400, 'Session ID is missing');
//         const sessionKey = `${user.mobileNumber}:session`;
//         const sessionData = await redis.get(sessionKey);
//         const session = sessionData ? JSON.parse(sessionData) : null;
//         if (!session || session.sessionId !== sessionIDFromClient) throw new CustomError(400, ERROR_RESPONSE.INVALID_SESSION[lang]);
//         if (getOTP !== req.body.motp) throw new CustomError(400, ERROR_RESPONSE.OTP_INVALID[lang]);
//       } else {
//         // send OTP
//         const fakeReq = { body: { mobileNumber: user.mobileNumber, returnOtp: true }, headers: req.headers };
//         const gotp = await authHelpers.generateOTP(fakeReq, res);
//         return Utils.sendResponse(res, gotp, 200, 'success');
//       }
//     }

//     // construct claim and issue token
//     const claimData = {
//       mobileNumber: user.mobileNumber,
//       email,
//       fullName: tokenPayload.name,
//       role: user.data?.[0]?.role || ROLE.USER,
//       userId: user.data?.[0]?.userId,
//       smeId: user.data?.[0]?.smeId,
//       accountType: user.data?.[0]?.accountType,
//       parentRole: user.data?.[0]?.role
//     };

//     const token = await auth.createToken(claimData);

//     // set cookies and response same as email
//     res.cookie('XSRF-TOKEN', token.sessionToken, {
//       httpOnly: false,
//       secure: true,
//       sameSite: 'None'
//     });
//     res.setHeader('X-Csrf-Token', token.sessionToken);

//     Utils.sendResponse(res, { accessToken: token.authToken }, 200, 'success');

//     // logging
//     const decodeToken = await auth.decodetoken(token.authToken);
//     decodeToken.loginType = 'Google';
//     await userService.createLoginHistory(req, decodeToken);

//     return;
//   } catch (e) {
//     console.error(e);
//     return Utils.sendResponse(res, e, e.statusCode ? e.statusCode : 500, 'failure', e.message);
//   }
// }

// /**
//  * Mobile OTP generation and verification
//  * - requestOtp: generate & store in redis plus store session
//  * - verifyOtp: validate OTP and issue token
//  */

// // Request OTP endpoint — keeps behavior compatible with original
// export async function requestMobileOtp(req, res) {
//   try {
//     const { mobileNumber, returnOtp } = req.body;
//     if (!mobileNumber) throw new CustomError(400, ERROR_RESPONSE.INVALID_PAYLOAD[req.headers.lang || DEFAULT_LNG]);

//     // generate OTP (use config.DEFAULT_OTP for dev)
//     const otp = config.USE_FIXED_OTP ? (config.DEFAULT_OTP || DEFAULT_OTP) : Math.floor(1000 + Math.random() * 9000).toString();

//     // store OTP to redis with TTL
//     await redis.set(mobileNumber, otp, 'EX', config.OTP_TTL || 120);

//     // create a sessionId and store session object (used for verifying OTP)
//     const sessionObj = { sessionId: Utils.generateSessionId?.() || `sess_${Date.now()}` };
//     await redis.set(`${mobileNumber}:session`, JSON.stringify(sessionObj), 'EX', config.OTP_TTL || 120);

//     // optionally return OTP for dev/testing when returnOtp true
//     if (returnOtp) {
//       return Utils.sendResponse(res, { otp, session: sessionObj }, 200, 'success');
//     }

//     // send SMS via your SMS provider here (omitted). You can also send email for verification.
//     // Example: sendVerificationEmail for dev fallback
//     await sendVerificationEmail({
//       to: config.DEV_NOTIFICATION_EMAIL,
//       subject: `OTP for ${mobileNumber}`,
//       html: `Your OTP is <b>${otp}</b>.`
//     });

//     return Utils.sendResponse(res, { otpLength: otp.length }, 200, 'success', '');
//   } catch (e) {
//     console.error(e);
//     return Utils.sendResponse(res, e, e.statusCode ? e.statusCode : 500, 'failure', e.message);
//   }
// }

// // Verify OTP and login
// export async function verifyMobileOtp(req, res) {
//   try {
//     const { mobileNumber, otp } = req.body;
//     const lang = req.headers.lang || DEFAULT_LNG;

//     if (!mobileNumber || !otp) throw new CustomError(400, ERROR_RESPONSE.INVALID_PAYLOAD[lang]);

//     const storedOtp = await redis.get(mobileNumber);

//     // allow fixed default OTP for dev if configured
//     const effectiveOtp = storedOtp || (config.USE_FIXED_OTP ? (config.DEFAULT_OTP || DEFAULT_OTP) : null);

//     if (!effectiveOtp || effectiveOtp !== otp) {
//       throw new CustomError(400, ERROR_RESPONSE.OTP_INVALID[lang]);
//     }

//     // optional session validation
//     const sessionIDFromClient = req.headers['sessionid'];
//     if (!sessionIDFromClient) throw new CustomError(400, ERROR_RESPONSE.SESSION_ID_MISSING[lang] || 'Session ID missing');

//     const sessionKey = `${mobileNumber}:session`;
//     const sessionData = await redis.get(sessionKey);
//     const session = sessionData ? JSON.parse(sessionData) : null;
//     if (!session || session.sessionId !== sessionIDFromClient) throw new CustomError(400, ERROR_RESPONSE.INVALID_SESSION[lang]);

//     // find user by mobile
//     const doc = await Users.findOne({ mobileNumber }).lean();
//     if (!doc) throw new CustomError(400, ERROR_RESPONSE.ACCOUNT_NOT_FOUND_BY_MOBILE[lang] || 'Account not found');

//     // build claim and token
//     const claimData = {
//       mobileNumber: doc.mobileNumber,
//       email: doc.data?.[0]?.email || doc.email,
//       fullName: doc.fullName,
//       role: doc.data?.[0]?.role || ROLE.USER,
//       userId: doc.data?.[0]?.userId,
//       smeId: doc.data?.[0]?.smeId,
//       accountType: doc.data?.[0]?.accountType,
//       parentRole: doc.data?.[0]?.role
//     };

//     const token = await auth.createToken(claimData);

//     // clear OTP
//     await redis.del(mobileNumber);
//     await redis.del(sessionKey);

//     // cookie + response
//     res.cookie('XSRF-TOKEN', token.sessionToken, {
//       httpOnly: false,
//       secure: true,
//       sameSite: 'None'
//     });
//     res.setHeader('X-Csrf-Token', token.sessionToken);
//     Utils.sendResponse(res, { accessToken: token.authToken }, 200, 'success');

//     // logging
//     const decodeToken = await auth.decodetoken(token.authToken);
//     decodeToken.loginType = 'Mobile';
//     await userService.createLoginHistory(req, decodeToken);

//     return;
//   } catch (e) {
//     console.error(e);
//     return Utils.sendResponse(res, e, e.statusCode ? e.statusCode : 500, 'failure', e.message);
//   }
// }