import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const pagesMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret)
        return res.status(500).json({ error: "missing ACCESS_TOKEN_SECRET" });

    const token = req.cookies.token;
    if (!token)
    {
        res.locals.user = null;
        return next();
    }

    try {
        res.locals.user = jwt.verify(token, jwtSecret) as any;
        return next();
    } catch {
        res.locals.user = null;
        return next();
    }
};
