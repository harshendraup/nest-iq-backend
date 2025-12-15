import mongoose, { Document, Schema } from "mongoose";

export interface IProperty extends Document {
  propertyId: string;
  brokerId: mongoose.Types.ObjectId;

  title: string;
  description: string;

  propertyType: "villa" | "flat" | "plot" | "independent-house" | "commercial";

  pricing: {
    totalPrice: number;
    pricePerSqFt: number;
    emiAvailable: boolean;
    emiAmount?: number;
  };

  dimensions: {
    carpetArea: number;
    builtupArea: number;
    plotArea?: number;
    length?: number;
    width?: number;
  };

  configuration: {
    bhk: number;
    bedrooms: number;
    bathrooms: number;
    balconies?: number;
    furnishing: "furnished" | "semi-furnished" | "unfurnished";
    kitchen: number;
    parking?: number;
  };

  propertyStatus: "ready-to-move" | "under-construction";

  launchDate?: Date;
  sellStartDate?: Date;
  possessionStartDate?: Date;

  overview: {
    size: string; // e.g., "1200 - 2400 sq.ft"
    reraId?: string;
    projectName?: string;
    builder?: string;
  };

  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;

    nearestLandmarks?: Array<{
      name: string;
      distance: string; // "2km", "5 mins"
    }>;
  };

  amenities: string[];

  gallery: {
    images: string[];
    videos?: string[];
  };

  reviews: {
    type: [String]
  },

  lastUpdatedOn: {
    type: Date
  }
  createdAt: Date;
  updatedAt: Date;
}

const landmarkSchema = new Schema({
  name: { type: String, required: true },
  distance: { type: String, required: true },
});

const propertySchema = new Schema<IProperty>(
  {
    propertyId: {
      type: String,
      unique: true,
      required: true,
    },

    brokerId: {
      type: Schema.Types.ObjectId,
      ref: "Broker",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String },

    propertyType: {
      type: String,
      enum: ["villa", "flat", "apartment", "house", "cottage", "commercial", "other",],
      required: true,
    },

    pricing: {
      totalPrice: { type: Number, required: true },
      pricePerSqFt: { type: Number, required: true },
      emiAvailable: { type: Boolean, default: false },
      emiAmount: { type: Number },
    },

    dimensions: {
      carpetArea: { type: Number, required: true },
      builtupArea: { type: Number, required: true },
      plotArea: { type: Number },
      length: { type: Number },
      width: { type: Number },
    },

    configuration: {
      bhk: { type: Number, required: true },
      bedrooms: { type: Number, required: true },
      bathrooms: { type: Number, required: true },
      balconies: { type: Number },
      furnishing: {
        type: String,
        enum: ["furnished", "semi-furnished", "unfurnished"],
        required: true,
      },
      kitchen: { type: Number, required: true },
      parking: { type: Number },
    },

    propertyStatus: {
      type: String,
      enum: ["ready-to-move", "under-construction"],
      required: true,
    },

    launchDate: { type: Date },
    sellStartDate: { type: Date },
    possessionStartDate: { type: Date },

    overview: {
      size: { type: String },
      reraId: { type: String },
      projectName: { type: String },
      builder: { type: String },
    },

    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },

      nearestLandmarks: [landmarkSchema],
    },

    amenities: [{ type: String }],

    gallery: {
      images: [{ type: String, required: true }],
      videos: [{ type: String }],
    },
    reviews: {
      type: [String]
    },

    lastUpdatedOn: {
      type: Date,
    },
  },
  { timestamps: true }
);

propertySchema.pre("save", function (next) {
  if (!this.propertyId) {
    this.propertyId = `PROP-${Date.now()}`;
  }
  next();
});

export const Property = mongoose.model<IProperty>("Property", propertySchema);
