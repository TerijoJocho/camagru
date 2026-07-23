import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware "best effort" : tente de décoder le JWT si présent, et remplit
 * res.locals.user en conséquence — mais ne bloque JAMAIS la requête, même
 * sans token ou avec un token invalide (res.locals.user = null dans ce cas).
 *
 * Utilisé sur les pages publiques (ex: /pages/gallery, /pages/gallery/:id)
 * où le contenu doit rester accessible à tout le monde, mais où les vues
 * EJS ont besoin de savoir si un visiteur est connecté ou non (pour
 * afficher/masquer les actions like/comment). Contrairement à authMiddleware,
 * qui protège des routes qui EXIGENT un compte.
 */
export const pagesMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret) return next();

    const token = req.cookies.token;
    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        res.locals.user = jwt.verify(token, jwtSecret) as any;
    } catch {
        res.locals.user = null;
    }
    return next();
};
