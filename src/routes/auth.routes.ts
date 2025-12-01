import express from "express";
import * as AuthController from "../controllers/auth.contollers"

const router = express.Router();

router.post('/is_authenticated/check', AuthController.handleToCheckisAuthenticatedOrNot);
router.post("/otp/request_for/login", AuthController.handleToLoginUserSendingOTP_ToMail);
router.post("/otp/verify/login", AuthController.handleToverifyOtpAndLoginToUser);
// api for login with google email not otp required to verify the google email
router.post("/login/google-email", AuthController.handleToLoginUserWithGoogleEmail);


router.post('/add/property', AuthController.handleAddTheProperty);
router.get('/get/properties', AuthController.handleToGetTheProperties);
const authRoutes = router;  

export default authRoutes;