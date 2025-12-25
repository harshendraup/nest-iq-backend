import express from "express";
import * as AuthController from "../controllers/auth.controllers"
import * as BookingController from "../controllers/booking.controllers";
import { authenticateUser, authorizeRoles } from "../middlewares/auth.middlewares";
import { handleCreateSubscriptionPlan, handleGetSubscriptionPlans } from "../controllers/subscriptionPlan.controllers";

const router = express.Router();



router.post('/register/user', AuthController.handleToRegisterBNBUser)
router.post('/send/verification/code', AuthController.handleToSendVerificationCodeOnEmail)
router.post('/verify/email/otp', AuthController.handleToVerifyEmailByOtp)
router.post('/login/user', AuthController.handleToLoginBNBUser)

router.post('/add/property', authenticateUser, AuthController.handleAddTheProperty);
router.get('/get/properties', authenticateUser, AuthController.handleToGetTheProperties);
router.delete('/delete/property/:id', authenticateUser, AuthController.handleDeleteProperty);
router.put('/update/property/:id', authenticateUser, AuthController.handleUpdateProperty);

// Booking Routes
router.post('/booking/add', authenticateUser, BookingController.handleCreateBooking);
router.get('/booking/all', authenticateUser, BookingController.handleGetBookings);

// Subscription Plan Routes
router.post("/subscription/plan/add", authenticateUser, handleCreateSubscriptionPlan);
router.get("/subscription/plans", handleGetSubscriptionPlans);

const authRoutes = router;

export default router;