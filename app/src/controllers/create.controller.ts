import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { Request, Response } from "express";
import { Picture } from "../models/picture.model";
import { fileTypeFromBuffer } from "file-type";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export const getStickers = async (req: Request, res: Response) => {
  try {
    const stickersPath = path.join(process.cwd(), "/public/stickers");
    if (!stickersPath)
      return res.status(500).json({error: "internal_server_error"});

    const files = await fs.readdir(stickersPath);

    const stickers = files.filter((file) =>
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file),
    );

    if (!stickers || stickers.length === 0)
      return res.status(500).json({error: "error_stickers"});

    res.json({ stickers: stickers });
  } catch (err) {
    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};

export const createCapture = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user._id;
    const { image, sticker, x, y, scale, rotation } = req.body;

    if (!image)
		return res.status(400).json({ error: "no_image" });
    if (!sticker || typeof sticker !== "string")
      return res.status(400).json({ error: "no_sticker" });

    // --- Whitelist du sticker : jamais faire confiance au nom envoyé par le client ---
    const stickersDir = path.join(process.cwd(), "public/stickers");
    const stickerFilename = path.basename(sticker); // anti path-traversal
    const availableStickers = await fs.readdir(stickersDir);
    if (!availableStickers.includes(stickerFilename))
      return res.status(400).json({ error: "invalid_sticker" });

    // --- Validation stricte des transforms ---
    const posX = Number(x);
    const posY = Number(y);
    const stickerScale = Number(scale);
    const rotationDeg = Number(rotation);

    if (
      !Number.isFinite(posX) || !Number.isFinite(posY) ||
      !Number.isFinite(stickerScale) || !Number.isFinite(rotationDeg) ||
      stickerScale < 0.1 || stickerScale > 2 ||
      posX < 0 || posX > CANVAS_WIDTH || posY < 0 || posY > CANVAS_HEIGHT
    ) {
      return res.status(400).json({ error: "invalid_sticker_transform" });
    }

    // --- Décodage + validation du fond envoyé par le client ---
    const base64Data = image.split(",")[1];
    if (!base64Data)
		return res.status(400).json({ error: "invalid_image_data" });
    const bgBuffer = Buffer.from(base64Data, "base64");

    const type = await fileTypeFromBuffer(bgBuffer);
    if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime))
      return res.status(400).json({ error: "invalid_file_type" });

    const background = sharp(bgBuffer).resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: "cover" });

    // --- Préparation du sticker (fichier serveur de confiance) ---
    const stickerPath = path.join(stickersDir, stickerFilename);
    const stickerMeta = await sharp(stickerPath).metadata();

    const scaledWidth = clamp(
      Math.round((stickerMeta.width ?? 1) * stickerScale),
      1,
      CANVAS_WIDTH,
    );
    const scaledHeight = clamp(
      Math.round((stickerMeta.height ?? 1) * stickerScale),
      1,
      CANVAS_HEIGHT,
    );

    const { data: stickerBuffer, info: stickerInfo } = await sharp(stickerPath)
      .resize(scaledWidth, scaledHeight)
      .rotate(rotationDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer({ resolveWithObject: true });

    // --- Position finale (centrée sur x,y), on garde le sticker dans le canvas ---
    const left = clamp(
      Math.round(posX - stickerInfo.width / 2),
      0,
      Math.max(0, CANVAS_WIDTH - stickerInfo.width),
    );
    const top = clamp(
      Math.round(posY - stickerInfo.height / 2),
      0,
      Math.max(0, CANVAS_HEIGHT - stickerInfo.height),
    );

    const fileName = `capture_${userId}_${Date.now()}.jpg`;
    const filePath = path.join(process.cwd(), "uploads", fileName);

    await background
	.composite([{ input: stickerBuffer, left, top }])
	.jpeg({ quality: 80 })
	.toFile(filePath);

    await Picture.create({ userId, filepath: fileName });

    return res.status(201).json({
      success: "capture_created",
      filepath: `/uploads/${fileName}`,
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_server_error" });
  }
};

export const getUserPictures = async (req: Request, res: Response) => {
  try {
    const pictures = await Picture.find({
      userId: res.locals.user._id,
    }).sort({ createdAt: -1});

    return res.status(200).json({
      pictures: pictures,
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_server_error" });
  }
};

export const deletePicture = async (req: Request, res:Response) => {
  try {
    const pictureId = req.body.pictureId;

    const picture = await Picture.findOneAndDelete({
      _id: pictureId,
      userId: res.locals.user._id,
    });

    if(!picture)
      {
        return res.status(404).json({
          error: "post_not_found"
        });
      }

    const filePath = path.join(process.cwd(), "uploads", picture?.filepath);

    await fs.unlink(filePath);

    return res.status(200).json({
      success: "picture_deleted",
      pictureId,
    });
  } catch (err) {
    return res.status(500).json({ error: "internal_server_error" });
  }
};
