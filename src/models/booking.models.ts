
import mongoose, { Document, Schema } from "mongoose";
import { entityIdGenerator } from "../utils/index";

export interface IBooking extends Document {
    bookingId: string;
    propertyId: string; // Linking to Property's propertyId (string) or ObjectId if you prefer
    brokerId: mongoose.Types.ObjectId; // Owner/Broker who made the booking

    customerName: string;
    customerEmail: string;
    customerPhone: string;

    startDate: Date;
    endDate: Date;

    status: "confirmed" | "pending" | "cancelled";
    totalAmount?: number;
    notes?: string;

    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        bookingId: {
            type: String,
            unique: true,
            required: true,
        },
        propertyId: {
            type: String,
            required: true,
        },
        brokerId: {
            type: Schema.Types.ObjectId,
            ref: "User", // Assuming User model is the broker/owner
            required: true,
        },
        customerName: { type: String, required: true },
        customerEmail: { type: String, required: true },
        customerPhone: { type: String, required: true },

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },

        status: {
            type: String,
            enum: ["confirmed", "pending", "cancelled"],
            default: "confirmed",
        },
        totalAmount: { type: Number },
        notes: { type: String },
    },
    { timestamps: true }
);

bookingSchema.pre("save", function (next) {
    if (!this.bookingId) {
        this.bookingId = entityIdGenerator("BK");
    }
    next();
});

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
