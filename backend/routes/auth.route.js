import express from "express";
import { getMe, login, logout, signup, requestVerificationCode, requestPasswordReset, resetPassword } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get('/me', protectRoute, getMe);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/request-verification-code', requestVerificationCode);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);



export default router;