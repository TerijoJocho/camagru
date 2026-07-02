import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res.status(401).json({error: "not authenticated"});

    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret)
      return res.status(500).json({error: "missing ACCESS_TOKEN_SECRET"});

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    res.locals.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({error: "invalid token"});
  }
};