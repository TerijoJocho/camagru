import { Router } from "express";
import { renderGalleryPage, renderSignupPage, renderLoginPage, renderForgotPasswordPage, renderProfilePage, renderPicture, renderCreatePage } from "../controllers/pages.controller";
import { pagesMiddleware } from "../middlewares/pages.middleware";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.use(pagesMiddleware);

router.get("/gallery", renderGalleryPage);
router.get("/gallery/:id", renderPicture);
router.get("/signup", renderSignupPage);
router.get("/login", renderLoginPage);
router.get("/forgotPassword", renderForgotPasswordPage);
router.get("/profile", authMiddleware, renderProfilePage);
router.get("/create", authMiddleware, renderCreatePage);

export default router;
