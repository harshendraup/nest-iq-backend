import { Schema, model, Document } from "mongoose";

export interface IGuest extends Document {
    name: string;
    email: string;
    mobileNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
    {
        name: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        mobileNumber: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
    }
);

export default model<IGuest>("Guest", GuestSchema);