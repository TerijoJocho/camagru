import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const isAjaxRequest = (req: Request) =>
  req.get("x-requested-with") === "XMLHttpRequest" ||
  (req.get("accept") ?? "").includes("application/json");


  /**
 * Protège une route : exige un JWT valide dans le cookie `token`.
 *
 * Répond différemment selon l'origine de la requête (voir isAjaxRequest) :
 * - requête AJAX (fetch, header X-Requested-With ou Accept: json) → renvoie
 *   un 401/500 JSON avec `redirect`, que le JS client interprète lui-même
 *   pour rediriger en douceur (voir feedbacks.ts).
 * - requête classique (navigation directe, ex: GET /pages/create tapé dans
 *   l'URL) → redirige directement via res.redirect(), pas de JS pour
 *   intercepter une réponse JSON dans ce cas.
 *
 * Contrairement à pagesMiddleware, celle-ci BLOQUE l'accès si pas connecté
 * (utilisée sur les routes qui exigent vraiment un compte, ex: /create/*).
 */
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
