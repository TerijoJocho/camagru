import type { Request, Response } from "express";
import { User } from "../models/user.model";
import { Picture } from "../models/picture.model";

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
  });
};

/*
 * sert le post sur lequel le user a cliqué
 */
export const renderPicture = async (req: Request, res: Response) => {
  try {
    const post = await Picture.findById(req.params.id)
      .populate("userId", "username")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "userId",
          select: "username",
        },
      });

      if (!post) return res.redirect("/pages/gallery?error=post_not_found");

      const isLiked = res.locals.user 
        ? post.likes.some((id: any) => id.equals(res.locals.user._id))
        : false;

    res.render("pages/picture", {
      post,
      isLiked,
      user: res.locals.user,
      error: typeof req.query.error === "string" ? req.query.error : "",
      success: typeof req.query.success === "string" ? req.query.success : "",
    });
  } catch (error) {
    console.error(error);
    return res.redirect("/pages/gallery?error=internal_server_error");
  }
};
