
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
    createdBy: string;

    createdAt: Date;
    updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        planId: {
            type: String,
            unique: true,
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
            type: String,
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
