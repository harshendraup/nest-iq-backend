import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  userId: string;
  googleEmail?: string;

  role: 'user' | 'admin' | 'broker';

  profileCompleted: boolean;
  profileImage?: string;
  dob?: Date;
  gender?: string;
  status: 'active' | 'inactive' | 'suspended';

  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  preferences?: {
    propertyType?: string[];
    budgetMin?: number;
    budgetMax?: number;
    preferredCities?: string[];
    bedrooms?: number[];
    amenities?: string[];
    furnishing?: string[];
  };

  searchHistory?: {
    query: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    date: Date;
  }[];

  savedProperties?: string[];

  viewedProperties?: {
    propertyId: string;
    viewedAt: Date;
  }[];

  activityLogs?: {
    action: string;
    propertyId?: string;
    device?: string;
    ip?: string;
    timestamp: Date;
  }[];

  visitBookings?: {
    propertyId: string;
    scheduledDate: Date;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  }[];

  isMobileVerified: boolean;
  isEmailVerified: boolean;

  kyc?: {
    adhaarNumber?: string;
    panNumber?: string;
    verified: boolean;
  };

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

const UserSchema = new Schema<IUser>(
  {
    // ---------------------------------- BASIC INFO ----------------------------------
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    password: { type: String, required: true, select: false },

    mobileNumber: { type: String },

    userId: { type: String, unique: true, required: true },

    googleEmail: { type: String },

    role: {
      type: String,
      enum: ["user", "admin", "broker"],
      default: "user",
    },

    profileCompleted: { type: Boolean, default: false },
    profileImage: { type: String },
    dob: { type: Date },
    gender: { type: String },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // ---------------------------------- ADDRESS ----------------------------------
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // ---------------------------------- PREFERENCES ----------------------------------
    preferences: {
      propertyType: [String],
      budgetMin: Number,
      budgetMax: Number,
      preferredCities: [String],
      bedrooms: [Number],
      amenities: [String],
      furnishing: [String],
    },

    // ---------------------------------- SEARCH HISTORY ----------------------------------
    searchHistory: [
      {
        query: String,
        city: String,
        minPrice: Number,
        maxPrice: Number,
        bedrooms: Number,
        date: { type: Date, default: Date.now },
      },
    ],

    // ---------------------------------- SAVED PROPERTIES ----------------------------------
    savedProperties: [{ type: String }],

    // ---------------------------------- VIEWED PROPERTIES ----------------------------------
    viewedProperties: [
      {
        propertyId: String,
        viewedAt: { type: Date, default: Date.now },
      },
    ],

    // ---------------------------------- ACTIVITY LOGS ----------------------------------
    activityLogs: [
      {
        action: String,
        propertyId: String,
        device: String,
        ip: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // ---------------------------------- VISIT BOOKINGS ----------------------------------
    visitBookings: [
      {
        propertyId: String,
        scheduledDate: Date,
        status: {
          type: String,
          enum: ["pending", "confirmed", "completed", "cancelled"],
          default: "pending",
        },
      },
    ],

    // ---------------------------------- VERIFICATIONS ----------------------------------
    isMobileVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    // ---------------------------------- KYC ----------------------------------
    kyc: {
      adhaarNumber: String,
      panNumber: String,
      verified: { type: Boolean, default: false },
    },

    // ---------------------------------- SESSIONS ----------------------------------
    sessions: [
      {
        device: String,
        ip: String,
        loggedInAt: { type: Date, default: Date.now },
        loggedOutAt: Date,
      },
    ],

    // ---------------------------------- NOTIFICATIONS ----------------------------------
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true, // Handles createdAt & updatedAt automatically
  }
);

export default model<IUser>("User", UserSchema);
