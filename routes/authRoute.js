import express from 'express';
import { authController } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/register', authController.registerUser);
authRouter.post('/verify-otp', authController.verifyOtp);
authRouter.post('/resend-otp', authController.resendOtp);
authRouter.post('/login', authController.loginUser);

export default authRouter;
