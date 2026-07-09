import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { Request, Response } from "express";

import { Picture } from "../models/picture.model";

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

    const image = req.body.image;
    if (!image)
      return res.status(400).json({ error: "no_image" });

    const base64Data = image.split(",")[1];
    const fileName = `capture_${userId}_${Date.now()}.jpg`;
    const filePath = path.join(process.cwd(), "uploads", fileName);

    await sharp(Buffer.from(base64Data, "base64"))
      .resize({ width: 1280 })
      .jpeg({ quality: 80 })
      .toFile(filePath);

    await Picture.create({
      userId,
      filepath: `${fileName}`,
    });

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
    console.error(err);
    return res.status(500).json({ error: "internal_server_error" });
  }
};