import express from "express";
import * as AuthController from "../controllers/auth.controllers"
import { authenticateUser, authorizeRoles } from "../middlewares/auth.middlewares";

const router = express.Router();



router.post('/register/user', AuthController.handleToRegisterBNBUser)
router.post('/send/verification/code', AuthController.handleToSendVerificationCodeOnEmail)
router.post('/verify/email/otp', AuthController.handleToVerifyEmailByOtp)
router.post('/login/user', AuthController.handleToLoginBNBUser)

router.post('/add/property', authenticateUser, AuthController.handleAddTheProperty);
router.get('/get/properties', AuthController.handleToGetTheProperties);
const authRoutes = router;

export default authRoutes;