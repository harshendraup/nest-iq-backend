
import mongoose, { Document, Schema } from "mongoose";
import { entityIdGenerator } from "../utils/index";

export interface ISubscriptionPlan extends Document {
    planId: string;
    name: string;
    price: number;
    currency: string;
    duration: "monthly" | "yearly" | "quarterly";
    features: string[];
    benefits: string[];
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId; // Admin User ID

    createdAt: Date;
    updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        planId: {
            type: String,
            unique: true,
            required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        duration: {
            type: String,
            enum: ["monthly", "yearly", "quarterly"],
            required: true
        },
        features: [{ type: String }],
        benefits: [{ type: String }],
        isActive: { type: Boolean, default: true },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

subscriptionPlanSchema.pre("save", function (next) {
    if (!this.planId) {
        this.planId = entityIdGenerator("SUB");
    }
    next();
});

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);
