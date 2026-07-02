import type { Request, Response } from "express";
import { User } from "../models/user.model";

/*
 * sert la page d'acceuil
 */
export const renderGalleryPage = async (req: Request, res: Response) => {
  res.render("pages/gallery", {
    user: res.locals.user,
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
  });
};

/*
 * sert la page d'inscription
 */
export const renderSignupPage = async (req: Request, res: Response) => {
  res.render("pages/signup", {
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
  });
};

/*
 * sert la page de connexion
 */
export const renderLoginPage = async (req: Request, res: Response) => {
  res.render("pages/login", {
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
  });
};

/*
 * sert la page de reset du password
 */
export const renderForgotPasswordPage = async (req: Request, res: Response) => {
  res.render("pages/forgotPassword", {
    token: typeof req.query.token === "string" ? req.query.token : "",
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
  });
};

/*
 * sert la page de profil
 */
export const renderProfilePage = async (req: Request, res: Response) => {
  const user = await User.findById(res.locals.user?._id);
  res.render("pages/profile", {
    user,
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
    },
  );
};