import { Router } from "express";
import { createNewAccount, confirmEmail, login, logout, forgotPassword, changePassword, getResetPasswordForm, resetPassword } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/register", createNewAccount);
router.get("/confirm", confirmEmail);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password", getResetPasswordForm);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);

export default router;
