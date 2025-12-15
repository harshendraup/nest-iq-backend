import { Property } from "../models/property.models";
import { NextFunction, Request, Response } from "express";
import { entityIdGenerator } from "../utils/index"
import jwt from 'jsonwebtoken';
import User from "../models/user.models";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  JWTPayload,
} from "../utils/jwt";
import * as AuthService from '../services/auth.services';
import { storeEmailCode } from '../services/otpVerify.services';
import { sendVerificationEmail } from '../services/email.services';
import logger from '../utils/logger';
import { OAuth2Client } from "google-auth-library";
import * as JWT from '../utils/jwt';


/**
 * Only email login implemented (request + verify).
 *
 * Expected payloads:
 * - Request code:
 *   { type: 'email', action: 'request', email: 'user@example.com' }
 *  
 * - Verify code:
 *   { type: 'email', action: 'verify', email: 'user@example.com', code: '123456', name?: 'User Name' }
 * 
 */

export const handleToRegisterBNBUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload?.email || !payload?.name || !payload?.password || !payload?.address?.city || !payload.role) {
      return res.status(400).json({
        message: "Invalid payload, name, email, password, role & city are required"
      });
    }

    const existing = await User.findOne({ email: payload.email });
    if (existing) {
      return res.status(409).json({
        message: "User already exists with this email"
      });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const device = payload.device || req.headers["user-agent"] || "Unknown device";
    const ip = payload.ip || req.ip || req.headers["x-forwarded-for"] || "Unknown IP";
    const userId = entityIdGenerator('USR')

    const newUser = new User({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      mobileNumber: payload.mobileNumber || null,
      userId: userId,

      role: payload.role || 'bnb_User',

      address: {
        ...payload.address
      },

      sessions: [{
        device,
        ip,
        loggedInAt: new Date()
      }],

      profileCompleted: false,
      isMobileVerified: false,
      isEmailVerified: false,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        userId: newUser.userId,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        role: newUser.role,
        address: newUser.address,
        sessions: newUser.sessions
      }
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
};


export const handleToSendVerificationCodeOnEmail = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }
    const existingUser = await User.findOne({ email: email, role: role });
    if (!existingUser) {
      return res.status(404).json({
        message: 'No user found with this email and role'
      });
    }

    const result = await AuthService.requestEmailLoginCode(email);

    return res.status(200).json({
      message: 'OTP sent to email',
      code: result.code
    });
  } catch (err: any) {
    logger.error('[SendEmailOTP]', err);
    return res.status(500).json({
      message: err.message || 'Failed to send email OTP'
    });
  }
}

export const handleToVerifyEmailByOtp = async (req: Request, res: Response) => {
  try {
    const { email, code, role } = req.body;

    const payload = req.body;
    if (!payload.email || !payload.code || !payload.role) {
      return res.status(400).json({
        message: 'Email, OTP code and role are required'
      });
    }
    const existingUser = await User.findOne({ email: email, role: role });
    if (!existingUser) {
      return res.status(404).json({
        message: 'No user found with this email and role'
      });
    }

    const result = await AuthService.verifyEmailLoginCode(
      email,
      code,
      role
    );
    if (result) {
      await User.updateOne({ email: email }, { isEmailVerified: true });
    }
    return res.status(200).json({
      message: 'Email verified successfully',
      token: result.token,
      user: result.user
    });
  } catch (err: any) {
    logger.warn('[VerifyEmailOTP]', err.message);
    return res.status(400).json({
      message: err.message || 'Invalid or expired OTP'
    });
  }
}

export const handleToLoginBNBUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload?.email || !payload?.password) {
      return res.status(400).json({
        message: "Email & password are required",
      });
    }

    const user: any = await User.findOne({ email: payload.email }).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
      });
    }

    const isValidPassword = await bcrypt.compare(
      payload.password,
      user.password
    );

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    const device = payload.device || req.headers["user-agent"] || "Unknown device";
    const ip =
      payload.ip ||
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "Unknown IP";

    user.sessions.push({
      device,
      ip,
      loggedInAt: new Date(),
    });

    await user.save();

    const jwtPayload: JWTPayload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      userId: user.userId,
      isEmailVerified: user.isEmailVerified,
      profileCompleted: user.profileCompleted,
    };

    const accessToken = generateAccessToken(jwtPayload);

    return res.status(200).json({
      message: "Login successful",

      tokens: {
        accessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },

      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber,
        status: user.status,

        profileCompleted: user.profileCompleted,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,

        profileImage: user.profileImage,
        gender: user.gender,
        dob: user.dob,

        address: user.address,
        preferences: user.preferences,

        sessions: user.sessions.slice(-3),
        lastLogin: user.sessions[user.sessions.length - 1],
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


export const handleAddTheProperty = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const propertyId = entityIdGenerator("PRO");

    const newProperty = new Property({
      propertyId: propertyId,
      brokerId: payload.brokerId,

      title: payload.title,
      description: payload.description,

      propertyType: payload.propertyType,

      pricing: {
        totalPrice: payload.pricing?.totalPrice,
        pricePerSqFt: payload.pricing?.pricePerSqFt,
        emiAvailable: payload.pricing?.emiAvailable,
        emiAmount: payload.pricing?.emiAmount
      },

      dimensions: {
        carpetArea: payload.dimensions?.carpetArea,
        builtupArea: payload.dimensions?.builtupArea,
        plotArea: payload.dimensions?.plotArea,
        length: payload.dimensions?.length,
        width: payload.dimensions?.width,
      },

      configuration: {
        bhk: payload.configuration?.bhk,
        bedrooms: payload.configuration?.bedrooms,
        bathrooms: payload.configuration?.bathrooms,
        balconies: payload.configuration?.balconies,
        furnishing: payload.configuration?.furnishing,
        kitchen: payload.configuration?.kitchen,
        parking: payload.configuration?.parking,
      },

      propertyStatus: payload.propertyStatus,

      launchDate: payload.launchDate,
      sellStartDate: payload.sellStartDate,
      possessionStartDate: payload.possessionStartDate,

      overview: {
        size: payload.overview?.size,
        reraId: payload.overview?.reraId,
        projectName: payload.overview?.projectName,
        builder: payload.overview?.builder,
      },

      location: {
        address: payload.location?.address,
        city: payload.location?.city,
        state: payload.location?.state,
        pincode: payload.location?.pincode,
        latitude: payload.location?.latitude,
        longitude: payload.location?.longitude,
        nearestLandmarks: payload.location?.nearestLandmarks,
      },

      amenities: payload.amenities,

      gallery: {
        images: payload.gallery?.images,
        videos: payload.gallery?.videos,
      },
      status: payload.status || "available",
      reviews: payload.reviews,
      lastUpdatedOn: payload.lastUpdatedOn
    });

    await newProperty.save();

    return res.status(201).json({
      message: "Property added successfully",
      property: newProperty
    });

  } catch (err: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
};


export const handleToGetTheProperties = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    let matchQuery = {};
    if (query.propertyId) {
      matchQuery = { propertyId: query.propertyId };
    }
    const properties = await Property.find(matchQuery);
    const totaLPropertyCount = properties.length
    return res.status(200).json({
      message: "Properties fetched successfully",
      properties: properties,
      total: totaLPropertyCount
    });
  }
  catch (err: any) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
};


