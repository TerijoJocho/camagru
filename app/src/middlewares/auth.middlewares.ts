import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res.redirect("/pages/login?error=not_authenticated");


    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret)
      return res.redirect("/pages/login?error=internal_server_error");

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    res.locals.user = decoded;
    
    next();
  } catch (error) {
    return res.redirect("/pages/login?error=internal_server_error");
  }
};