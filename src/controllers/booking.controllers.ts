
import { Request, Response } from "express";
import { Booking } from "../models/booking.models";
import { Property } from "../models/property.models";
import Guest from "../models/guest.models";

interface CustomRequest extends Request {
    user?: {
        _id: string;
    };
}

export const handleCreateBooking = async (req: CustomRequest, res: Response) => {
    try {
        const decodedToken = (req as any).user;

        if (!decodedToken) {
            return res.status(401).json({
                message: "Unauthorized access - invalid token"
            });
        }
        const {
            propertyId,
            customerName,
            customerEmail,
            customerPhone,
            startDate,
            endDate,
            totalAmount,
            notes,
        } = req.body;

        console.log("Create Booking Request Body:", req.body);
        console.log("Decoded Token:", decodedToken);

        const brokerId = decodedToken.id;

        if (!brokerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        const existingBooking = await Booking.findOne({
            propertyId,
            status: { $ne: "cancelled" },
            $or: [
                { startDate: { $lt: new Date(endDate), $gte: new Date(startDate) } },
                { endDate: { $gt: new Date(startDate), $lte: new Date(endDate) } },
                { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(endDate) } } // Enveloping booking
            ]
        });

        if (existingBooking) {
            return res.status(409).json({ message: "Slot already booked for this property." });
        }

        const newBooking = new Booking({
            propertyId,
            brokerId,
            customerName,
            customerEmail,
            customerPhone,
            startDate,
            endDate,
            totalAmount,
            notes,
            status: "confirmed",
        });

        await newBooking.save();

        // Save visitor/customer to Guest collection
        const existingGuest = await Guest.findOne({ mobileNumber: customerPhone });
        if (!existingGuest) {
            const newGuest = new Guest({
                name: customerName,
                email: customerEmail,
                mobileNumber: customerPhone,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await newGuest.save();
        }

        return res.status(201).json({
            message: "Booking created successfully",
            booking: newBooking,
        });
    } catch (error: any) {
        console.error("Error creating booking:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message, stack: error.stack });
    }
};

export const handleGetBookings = async (req: CustomRequest, res: Response) => {
    try {
        const decodedToken = (req as any).user;

        if (!decodedToken || !decodedToken.id) {
            return res.status(401).json({
                message: "Unauthorized access - invalid token"
            });
        } const { propertyId } = req.query;



        const query: any = { brokerId: decodedToken.id };

        if (propertyId) {
            query.propertyId = propertyId;
        }

        const bookings = await Booking.find(query).sort({ startDate: 1 });

        return res.status(200).json({ bookings });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
