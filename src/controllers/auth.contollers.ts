import userModels from "../models/user.models";
import { Property } from "../models/property.models";
import { NextFunction, Request, Response } from "express";
import { entityIdGenerator } from "../utils/index"
import jwt from 'jsonwebtoken';
import  User  from "../models/user.models";

import * as AuthService from '../services/auth.services';
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
export const handleToCheckisAuthenticatedOrNot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        loggedIn: false,
        message: "Login required",
      });
    }

    const token = authHeader.split(" ")[1];


    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return res.status(401).json({
        success: false,
        loggedIn: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(401).json({
        success: false,
        loggedIn: false,
        message: "User does not exist with token info or token is invalid",
      });
    }


    if (user.status === "inactive" || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        loggedIn: false,
        message: `Account is ${user.status}. Contact support.`,
      });
    }


    (req as any).user = { id: user._id };

    next();
    return res.status(200).json({
      success: true,
      loggedIn: true,
      message: "User is authenticated",
    });

  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(500).json({
      success: false,
      loggedIn: false,
      message: "Internal server error",
    });
  }
};


export const handleToLoginUserSendingOTP_ToMail = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (payload.email) {

      const existingUser = await userModels.findOne({ email: payload.email });
      if (existingUser) {
        logger.warn(`Login attempt with non-existent email: ${payload.email}`);
        return res.status(400).json({
          success: true,
          message: "User with this email does not exist. OTP not sent."
        });
      }
      const sendMail = await AuthService.requestEmailLoginCode(payload.email);

      return res.status(200).json({
        success: true,
        message: `otp sent successfully on:${payload.email}.`,
        emailCode: sendMail.code 
      });
    }

    if (payload.mobileNumber) {
      const existingUser = await userModels.findOne({ mobileNumber: payload.mobileNumber });
      console.log(existingUser?.mobileNumber);
      if (existingUser) {
        logger.warn(`Login attempt with non-existent mobile no: ${payload.mobileNumber}`);
        return res.status(200).json({
          success: true,
          message: `otp sent successfully on:${payload.mobileNumber}.`
        });
      }
      const sendSms = await AuthService.requestMobileLoginCode(payload.mobileNumber);

      return res.status(200).json({
        success: true,
        message: "OTP sent to mobile number (development mode)",
        mobileCode: sendSms.code  // REMOVE in production
      });
    }

    return res.status(400).json({
      success: false,
      message: "email or mobileNumber is required"
    });

  } catch (err: any) {
    logger.error("sendEmailOtp error", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Internal server error"
    });
  }
};


export const handleToverifyOtpAndLoginToUser = async (req: Request, res: Response) => {
  try {
    const { email, mobileNumber, code, name } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "OTP code is required"
      });
    }

    let result: any;

    if (email) {
      result = await AuthService.verifyEmailLoginCode(email, code, name);
    }

    else if (mobileNumber) {
      result = await AuthService.verifyMobileLoginCode(mobileNumber, code, name);
    }

    else {
      return res.status(400).json({
        success: false,
        message: "email or mobileNumber is required"
      });
    }

    const { token, user } = result;

    if (user.password) delete user.password;

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    return res.status(200).json({
      success: true,
      token,
      user
    });

  } catch (err: any) {
    logger.error("verifyOtpAndLogin error", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
};

export const handleToLoginUserWithGoogleEmail = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload.idToken) {
      return res.status(400).json({
        success: false,
        message: "ID token is required"
      });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: payload.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const IdToken = ticket.getPayload();
    if (!IdToken) {
       return res.status(400).json({success: false,
        message: "Invalid Google ID token"
      });

    }
    const googleEmail = payload.email;
    const name = payload.name || "Google User";
    const picture = payload.picture;

    const existingUser = await userModels.findOne({ email: googleEmail });
    if(existingUser){
      logger.info(`Google login for existing user: ${googleEmail}`);
      const result = await AuthService.completeLogin(googleEmail, undefined, name);
      const { token, user } = result;

      if (user.password){
        await userModels.updateOne({ email: googleEmail }, { $unset: { password: "" } });
      };

      return res.status(200).json({
        success: true,
        token,
        user
      });
    }
    const newUser = await userModels.create({
      email: googleEmail,
      name: name,
      isEmailVerified: true,
      profilePicture: picture,
      password: undefined
    });
    logger.info(`New user created via Google login: ${googleEmail}`);

   const result = await JWT.generateAccessToken({
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role || "user"
    });

    const token = result;
    const user = newUser.toObject();  

    return res.status(200).json({
      success: true,
      token,
      user
    }); 
  }
  catch (err: any) {
    logger.error("googleLogin error", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }

}


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
      reviews:payload.reviews,
      lastUpdatedOn:payload.lastUpdatedOn
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


