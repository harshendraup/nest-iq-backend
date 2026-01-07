import express from "express";
import * as AttendanceController from "../controllers/attendance.controllers";
import { authenticateUser } from "../middlewares/auth.middlewares";

const router = express.Router();

router.post("/add-user", authenticateUser, AttendanceController.addAttendanceUser);
router.get("/users", authenticateUser, AttendanceController.getAttendanceUsers);
router.post("/mark", authenticateUser, AttendanceController.markAttendance);
router.get("/records", authenticateUser, AttendanceController.getAttendanceRecords);

export default router;
