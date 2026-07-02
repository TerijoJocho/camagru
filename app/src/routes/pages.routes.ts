import { Router } from "express";
import { renderGalleryPage, renderSignupPage, renderLoginPage, renderForgotPasswordPage, renderProfilePage } from "../controllers/pages.controller";
import { pagesMiddleware } from "../middlewares/pages.middleware";

const router = Router();

router.use(pagesMiddleware);

router.get("/gallery", renderGalleryPage);
router.get("/signup", renderSignupPage);
router.get("/login", renderLoginPage);
router.get("/forgotPassword", renderForgotPasswordPage);
router.get("/profile", renderProfilePage);


export default router;
