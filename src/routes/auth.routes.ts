import express from "express";
import * as AuthController from "../controllers/auth.controllers"

const router = express.Router();



router.post('/register/user',AuthController.handleToRegisterBNBUser)
router.post('/add/property', AuthController.handleAddTheProperty);
router.get('/get/properties', AuthController.handleToGetTheProperties);
const authRoutes = router;  

export default authRoutes;