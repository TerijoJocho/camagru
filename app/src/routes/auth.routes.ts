import { Router } from "express";
import { createNewAccount, confirmEmail, login, logout, forgotPassword, getResetPasswordForm, resetPassword, updateProfile, changeProfilePassword, toggleEmailNotifications } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/register", createNewAccount);
router.get("/confirm", confirmEmail);

router.post("/login", login);
router.post("/logout", logout);

router.get("/reset-password", getResetPasswordForm);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


router.post("/change-profile", authMiddleware, updateProfile);
router.post("/change-profile-password", authMiddleware, changeProfilePassword);
router.post("/change-user-preference", authMiddleware, toggleEmailNotifications);

export default router;
