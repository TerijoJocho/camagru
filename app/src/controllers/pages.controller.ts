import type { Request, Response } from "express";

/*
 * sert la page d'acceuil
 */
export const renderGalleryPage = async (req: Request, res: Response) => {
  res.render("pages/gallery", {
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
