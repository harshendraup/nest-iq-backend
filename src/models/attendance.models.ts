import { Schema, model, Document } from "mongoose";

export interface IAttendanceUser extends Document {
    name: string;
    email: string;
    mobile: string;
    role: string;
    address: string;
    city: string;
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceUserSchema = new Schema<IAttendanceUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        mobile: { type: String, required: true },
        role: { type: String, default: "Staff" },
        address: { type: String },
        city: { type: String },
    },
    { timestamps: true }
);

export const AttendanceUser = model<IAttendanceUser>("AttendanceUser", AttendanceUserSchema);

export interface IAttendance extends Document {
    attendanceUserId: Schema.Types.ObjectId;
    date: Date;
    status: 'present' | 'absent' | 'half-day';
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        attendanceUserId: { type: Schema.Types.ObjectId, ref: "AttendanceUser", required: true },
        date: { type: Date, required: true },
        status: {
            type: String,
            enum: ['present', 'absent', 'half-day'],
            required: true
        },
    },
    { timestamps: true }
);

// Compound index to ensure one attendance per user per day
AttendanceSchema.index({ attendanceUserId: 1, date: 1 }, { unique: true });

export const Attendance = model<IAttendance>("Attendance", AttendanceSchema);
