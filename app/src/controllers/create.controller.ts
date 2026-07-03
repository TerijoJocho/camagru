import fs from "fs/promises";
import path from "path";
import type { Request, Response } from "express";

import { Picture } from "../models/picture.model";

export const getEditorStatus = (_req: Request, res: Response) => {
  void Picture;
  return res.redirect("/pages/gallery?success=editor_ready");
};

export const getStickers = async (req: Request, res: Response) => {
  try {
    const stickersPath = path.join(process.cwd(), "src/public/stickers");

    const files = await fs.readdir(stickersPath);

    const stickers = files.filter((file) =>
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file)
    );

    res.json(stickers);

  } catch (err) {
    res.render("pages/create?error=error_stickers", {
      error: typeof req.query.error === "string" ? req.query.error : "",
      success: typeof req.query.success === "string" ? req.query.success : "",
    });
  }
};