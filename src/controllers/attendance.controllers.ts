import { Request, Response } from "express";
import { AttendanceUser, Attendance } from "../models/attendance.models";

export const addAttendanceUser = async (req: Request, res: Response) => {
    try {
        const { name, email, mobile, role, address, city } = req.body;

        if (!name || !email || !mobile) {
            return res.status(400).json({ message: "Name, email, and mobile are required" });
        }

        const existingUser = await AttendanceUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const newUser = new AttendanceUser({ name, email, mobile, role, address, city });
        await newUser.save();

        res.status(201).json({ message: "Attendance user added successfully", user: newUser });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAttendanceUsers = async (req: Request, res: Response) => {
    try {
        const users = await AttendanceUser.find().sort({ createdAt: -1 });
        res.status(200).json({ users });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const markAttendance = async (req: Request, res: Response) => {
    try {
        const { attendanceUserId, date, status } = req.body;

        if (!attendanceUserId || !date || !status) {
            return res.status(400).json({ message: "attendanceUserId, date, and status are required" });
        }

        // Set time to midnight for the date to avoid multiple entries per day
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const existingAttendance = await Attendance.findOne({ attendanceUserId, date: attendanceDate });

        if (existingAttendance) {
            existingAttendance.status = status;
            await existingAttendance.save();
            return res.status(200).json({ message: "Attendance updated successfully", attendance: existingAttendance });
        }

        const newAttendance = new Attendance({
            attendanceUserId,
            date: attendanceDate,
            status
        });
        await newAttendance.save();

        res.status(201).json({ message: "Attendance marked successfully", attendance: newAttendance });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAttendanceRecords = async (req: Request, res: Response) => {
    try {
        const records = await Attendance.find()
            .populate("attendanceUserId")
            .sort({ date: -1 });
        res.status(200).json({ records });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
