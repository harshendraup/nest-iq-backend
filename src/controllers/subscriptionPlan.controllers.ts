
import { Request, Response } from "express";
import { SubscriptionPlan } from "../models/subscriptionPlan.models";
import { entityIdGenerator } from "../utils/index";
interface CustomRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const handleCreateSubscriptionPlan = async (req: CustomRequest, res: Response) => {
    try {
        // const decodedToken = (req as any).user;

        // if (!decodedToken || decodedToken.role !== 'admin') {
        //     return res.status(403).json({
        //         message: "Forbidden: Only admins can create subscription plans"
        //     });
        // }

        const {
            name,
            price,
            currency,
            duration,
            features,
            benefits,
            isActive
        } = req.body;
        const planId = entityIdGenerator("SUB");

        const newPlan = new SubscriptionPlan({
            name,
            price,
            currency,
            duration,
            features,
            benefits,
            isActive,
            planId,
            createdBy: "admin"
        });

        await newPlan.save();

        return res.status(201).json({
            message: "Subscription plan created successfully",
            plan: newPlan
        });
    } catch (error: any) {
        console.error("Error creating subscription plan:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export const handleGetSubscriptionPlans = async (req: Request, res: Response) => {
    try {
        // Fetch only active plans for public view. 
        // Admin might want to see all, but for now let's serve active ones or allow query param.
        const { includeInactive } = req.query;

        const query: any = { isActive: true };
        if (includeInactive === 'true') {
            delete query.isActive;
        }

        const plans = await SubscriptionPlan.find(query).sort({ price: 1 });

        return res.status(200).json({
            message: "Subscription plans fetched successfully",
            plans
        });
    } catch (error: any) {
        console.error("Error fetching subscription plans:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
