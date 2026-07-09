import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const isAjaxRequest = (req: Request) =>
  req.get("x-requested-with") === "XMLHttpRequest" ||
  (req.get("accept") ?? "").includes("application/json");

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return isAjaxRequest(req)
        ? res.status(401).json({ error: "not_authenticated", redirect: "/pages/login" })
        : res.redirect("/pages/login?error=not_authenticated");

    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret)
      return isAjaxRequest(req)
        ? res.status(500).json({ error: "internal_server_error" })
        : res.redirect("/pages/login?error=internal_server_error");

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    res.locals.user = decoded;
    
    next();
  } catch (error) {
    return isAjaxRequest(req)
      ? res.status(500).json({ error: "internal_server_error" })
      : res.redirect("/pages/login?error=internal_server_error");
  }
};