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
      return res.status(400).json({
        error: "invalid_registration_data",
      });
    }

    const username = value.username;
    const email = value.email;
    const password = value.password;
    const confirmPassword = value.confirmPassword;

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "password_mismatch",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "user_already_exists",
      });
    }

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
    return res.status(200).json({
      success: "account_created",
      redirect: "/pages/login",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};

/*
 * Envoie l'email de confirmation au nouvel utilisateur
 */
export const confirmEmail = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      return res.redirect("/pages/login?success=missing_confirmation_token");
    }

    const user = await User.findOne({ confirmationToken: token });
    if (!user) {
      return res.redirect("/pages/login?success=invalid_confirmation_token");
    }

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
    return res.redirect("/pages/login?success=internal_server_error");
  }
};

/*
 * Connecte l'utilisateur
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "invalid_credentials",
      });
    }

    const identifier = value.identifier;
    const password = value.password;

    const user = await User.findOne({
		$or: [{email: identifier}, {username: identifier}],
	});
    if (!user) {
      return res.status(404).json({
        error: "user_not_found",
      });
    }

    if (user.accountConfirmed === false) {
      return res.status(401).json({
        error: "email_not_confirmed",
      });
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({
        error: "bad_password",
      });
    }

    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        error: "server_error",
      });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: "1h" },
    );
    const response = res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
	  path: "/",
    });

    return response.status(200).json({
      success: "login_successful",
      redirect: "/pages/gallery",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
      redirect: "/pages/login",
    });
  }
};

/*
 * Déconnecte l'utilisateur
 */
export const logout = async (req: Request, res: Response) => {
	try {
		res.clearCookie("token", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
		});

		if (!res.locals.user)
		{
			return res.status(200).json({
				success: "logout_successful",
				redirect: "/pages/login",
			});
		}

		return res.status(200).json({
			success: "logout_successful",
			redirect: "/pages/gallery",
		});
	} catch (error) {
	  return res.status(500).json({
		error: "internal_server_error",
		redirect: "/pages/gallery",
	  });
	}
};

/*
 * Permet à un utilisateur de rénitialiser son mot de passe
 * s'il l'a oublié après qu'il ai indiqué son email
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { error, value } = emailSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "invalid_email",
      });
    }

    const email = value.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: "user_not_found",
      });
    }

    const forgotPasswordToken = randomBytes(32).toString("hex");

    await User.updateOne(
      { email },
      {
        $set: {
          forgotPasswordToken,
        },
      },
    );

    await sendForgotPasswordEmail(email, forgotPasswordToken);

    return res.status(200).json({
      success: "forgot_password_email_sent",
      redirect: "/pages/login",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
      redirect: "/pages/login",
    });
  }
};

// GET
export const getResetPasswordForm = async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  res.render("pages/resetPassword", {
    user: null,
    token,
    csrfToken: req.csrfToken(),
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
  });
};
// POST
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
      return res.status(400).json({
        error: "missing_reset_token",
      });
    }

    const { error, value } = resetPasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "invalid_password",
      });
    }

    const user = await User.findOne({ forgotPasswordToken: token });

    if (!user) {
      return res.status(404).json({
        error: "invalid_reset_token",
      });
    }

    const password = value.password;
    const confirmPassword = req.body.confirmPassword;

    if (confirmPassword !== password) {
      return res.status(400).json({
        error: "password_mismatch",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await User.updateOne(
      { forgotPasswordToken: token },
      {
        $set: {
          password: hashedPassword,
          forgotPasswordToken: null,
        },
      },
    );

    return res.status(200).json({
      success: "password_reset_successful",
      redirect: "/pages/login",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
      redirect: "/pages/login",
    });
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
    if (!user) {
      return res.status(404).json({
        error: "user_not_found",
        redirect: "/pages/login",
      });
    }

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "invalid_registration_data",
      });
    }

    const { username, email } = value;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: userID },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "user_already_exists",
      });
    }

    const updateFields: Record<string, string> = {};

    if (username) updateFields.username = username;
    if (email) updateFields.email = email;

    if (Object.keys(updateFields).length > 0)
      await User.updateOne({ _id: userID }, { $set: updateFields });

    return res.status(200).json({
      success: "profile_changed",
      redirect: "/pages/profile",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};

/*
 * Permet à un utilisateur de changer son username et email
 * quand il veut tant qu'il est authentifié
 */
export const changeProfilePassword = async (req: Request, res: Response) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "invalid_password",
      });
    }

    const user = await User.findById(res.locals.user._id);

    if (!user) {
      return res.status(401).json({
        error: "not_authenticated",
        redirect: "/pages/login",
      });
    }

    const result = await bcrypt.compare(value.currentPassword, user.password);

    if (!result) {
      return res.status(401).json({
        error: "bad_current_password",
      });
    }

    if (value.newPassword !== value.confirmNewPassword) {
      return res.status(400).json({
        error: "password_mismatch",
      });
    }

    const hashedPassword = await bcrypt.hash(value.newPassword, 10);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          forgotPasswordToken: null,
        },
      },
    );

    return res.status(200).json({
      success: "password_changed",
      redirect: "/pages/profile",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
    });
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
      { $set: { emailNotifications: emailNotifications } },
    );

    return res.status(200).json({
      success: "profile_changed",
      redirect: "/pages/profile",
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};
