import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { User } from "../models/user.model";
import {
  registerSchema,
  loginSchema,
  emailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/auth.joi";
import { sendConfirmationEmail } from "../utils/sendConfirmationEmail";
import { sendForgotPasswordEmail } from "../utils/sendForgotPasswordEmail";

/*
 * Créer un nouvel utilisateur
 */
export const createNewAccount = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.redirect("/pages/signup?error=invalid_registration_data");
    }

    const username = value.username;
    const email = value.email;
    const password = value.password;
    const confirmPassword = value.confirmPassword;

    if (password !== confirmPassword)
      return res.redirect("/pages/signup?error=password_mismatch");

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser)
      return res.redirect("/pages/signup?error=user_already_exists");

    const saltRounds: number = 10;
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    const confirmationToken = randomBytes(32).toString("hex");

    await User.create({
      username,
      email,
      password: hashedPassword,
      confirmationToken,
    });

    await sendConfirmationEmail(email, confirmationToken);
    return res.redirect("/pages/login?success=account_created");
  } catch (error) {
    return res.redirect("/pages/signup?error=internal_server_error");
  }
};

/*
 * Envoie l'email de confirmation au nouvel utilisateur
 */
export const confirmEmail = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token)
      return res.redirect("/pages/login?error=missing_confirmation_token");

    const user = await User.findOne({ confirmationToken: token });
    if (!user)
      return res.redirect("/pages/login?error=invalid_confirmation_token");

    await User.updateOne(
      { confirmationToken: token },
      {
        $set: {
          accountConfirmed: true,
          confirmationToken: null,
        },
      },
    );
    return res.redirect("/pages/login?success=email_confirmed");
  } catch (error) {
    return res.redirect("/pages/login?error=internal_server_error");
  }
};

/*
 * Connecte l'utilisateur
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.redirect("/pages/login?error=invalid_credentials");

    const email = value.email;
    const password = value.password;

    const user = await User.findOne({ email: email });
    if (!user) return res.redirect("/pages/login?error=user_not_found");

    if (user.accountConfirmed === false)
      return res.redirect("/pages/login?error=email_not_confirmed");

    const result = await bcrypt.compare(password, user.password);
    if (!result) return res.redirect("/pages/login?error=bad_password");

    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret) return res.redirect("/pages/login?error=server_error");

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: "1h" },
    );
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .redirect("/pages/gallery");
  } catch (error) {
    return res.redirect("/pages/login?error=internal_server_error");
  }
};

/*
 * Déconnecte l'utilisateur
 */
export const logout = async (req: Request, res: Response) => {
  return res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    .redirect("/pages/login?success=logout_successful");
};

/*
 * Permet à un utilisateur de rénitialiser son mot de passe
 * s'il l'a oublié après qu'il ai indiqué son email
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { error, value } = emailSchema.validate(req.body);
    if (error) return res.redirect("/pages/login?error=invalid_email");

    const email = value.email;

    const user = await User.findOne({ email: email });
    if (!user) return res.redirect("/pages/login?error=user_not_found");

    const forgotPasswordToken = randomBytes(32).toString("hex");

    await User.updateOne(
      { email: email },
      { $set: { forgotPasswordToken: forgotPasswordToken } },
    );

    await sendForgotPasswordEmail(email, forgotPasswordToken);
    return res.redirect("/pages/login?success=forgot_password_email_sent");
  } catch (error) {
    return res.redirect("/pages/login?error=internal_server_error");
  }
};

// GET
export const getResetPasswordForm = async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  res.render("pages/resetPassword", {
    token,
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
  });
};
// POST
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) return res.redirect("/pages/login?error=missing_reset_token");

    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error)
      return res.redirect(
        `/pages/reset-password?token=${encodeURIComponent(token)}&error=invalid_password`,
      );

    const user = await User.findOne({ forgotPasswordToken: token });
    if (!user) return res.redirect("/pages/login?error=invalid_reset_token");

    const password = value.password;
    const confirmPassword = req.body.confirmPassword;
    if (confirmPassword !== password)
      return res.redirect(
        `/pages/reset-password?token=${encodeURIComponent(token)}&error=password_mismatch`,
      );

    const saltRounds: number = 10;
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    await User.updateOne(
      { forgotPasswordToken: token },
      {
        $set: {
          password: hashedPassword,
          forgotPasswordToken: null,
        },
      },
    );
    return res.redirect("/pages/login?success=password_reset_successful");
  } catch (error) {
    return res.redirect("/pages/login?error=internal_server_error");
  }
};

/*
 * Permet à un utilisateur de changer son mot de passe
 * quand il veut tant qu'il est authentifié
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const _id = req.user?._id;
    if (!_id) return res.redirect("/pages/login?error=not_authenticated");

    const user = await User.findOne({ _id: _id });
    if (!user) return res.redirect("/pages/login?error=user_not_found");

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error)
      return res.redirect("/pages/gallery?error=invalid_password_change_data");

    const currentPassword = value.currentPassword;
    const result = await bcrypt.compare(currentPassword, user.password);
    if (!result)
      return res.redirect("/pages/gallery?error=bad_current_password");

    const newPassword = value.newPassword;
    const confirmNewPassword = value.confirmNewPassword;
    if (newPassword !== confirmNewPassword)
      return res.redirect("/pages/gallery?error=password_mismatch");

    const saltRounds: number = 10;
    const hashedNewPassword: string = await bcrypt.hash(
      newPassword,
      saltRounds,
    );

    await User.updateOne(
      { _id: _id },
      {
        $set: {
          password: hashedNewPassword,
        },
      },
    );
    return res.redirect("/pages/gallery?success=password_changed");
  } catch (error) {
    return res.redirect("/pages/gallery?error=internal_server_error");
  }
};

/*
 * Permet à un utilisateur de changer son username et email
 * quand il veut tant qu'il est authentifié
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userID = res.locals.user._id;

    const user = await User.findOne({ _id: userID });
    if (!user) return res.redirect("/pages/login?error=user_not_found");

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      console.log(error);
      return res.redirect("/pages/profile?error=invalid_registration_data");
    }

    const username: string = value.username;
    const email: string = value.email;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: userID },
    });

    if (existingUser)
      return res.redirect("/pages/profile?error=user_already_exists");

    const updateFields: any = {};

    if (username) updateFields.username = username;
    if (email) updateFields.email = email;

    if (Object.keys(updateFields).length > 0)
      await User.updateOne({ _id: userID }, { $set: updateFields });

    return res.redirect("/pages/profile?success=profile_changed");
  } catch (error) {
    return res.redirect("/pages/profile?error=internal_server_error");
  }
};

/*
 * Permet à un utilisateur de changer son username et email
 * quand il veut tant qu'il est authentifié
 */
export const changeProfilePassword = async (req: Request, res: Response) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) return res.redirect("/pages/profile?error=invalid_password");

    const user = await User.findOne({ _id: res.locals.user._id });
    if (!user) return res.redirect("/pages/login?error=not_authenticated");

    const currentPassword = value.currentPassword;
    const result = await bcrypt.compare(currentPassword, user.password);
    if (!result)
      return res.redirect("/pages/profile?error=bad_current_password");

    const newPassword = value.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    if (confirmNewPassword !== newPassword)
      return res.redirect("/pages/profile?error=password_mismatch");

    const saltRounds: number = 10;
    const hashedPassword: string = await bcrypt.hash(newPassword, saltRounds);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          forgotPasswordToken: null,
        },
      },
    );
    return res.redirect("/pages/profile?success=password_reset_successful");
  } catch (error) {
    return res.redirect("/pages/profile?error=internal_server_error");
  }
};

/*
 * Permet à un utilisateur d'activer/desactiver les notifs par email
 * quand il veut tant qu'il est authentifié
 */
export const toggleEmailNotifications = async (req: Request, res: Response) => {
  try {
    const emailNotifications = req.body.emailNotifications === "on";

    await User.updateOne(
      { _id: res.locals.user._id },
      { $set: { emailNotifications: emailNotifications } }
    );

    return res.redirect("/pages/profile?success=profile_changed");
  } catch (error) {
    return res.redirect("/pages/profile?error=internal_server_error");
  }
};
