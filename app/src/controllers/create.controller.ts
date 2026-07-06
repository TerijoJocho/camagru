import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { Request, Response } from "express";

import { Picture } from "../models/picture.model";

export const getStickers = async (req: Request, res: Response) => {
  try {
    const stickersPath = path.join(process.cwd(), "src/public/stickers");

    const files = await fs.readdir(stickersPath);

    const stickers = files.filter((file) =>
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file),
    );

    res.json({ stickers: stickers });
  } catch (err) {
    res.render("pages/create?error=error_stickers", {
      error: typeof req.query.error === "string" ? req.query.error : "",
      success: typeof req.query.success === "string" ? req.query.success : "",
    });
  }
};

export const createCapture = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user._id;

    const image = req.body.image;
    if (!image) 
      return res.status(400).json({ error: "No image provided" });

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
      success: "Picture created successfully",
      filepath: `/uploads/${fileName}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Capture failed" });
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
    console.error(err);
    return res.status(500).json({ error: "Getting pictures failed" });
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
          error: "Picture not found"
        });  
      }
      
    const filePath = path.join(process.cwd(), "uploads", picture?.filepath);

    await fs.unlink(filePath);

    return res.redirect("/pages/create?success=picture_deleted");
  } catch (err) {
    console.error(err);
    return res.redirect("/pages/create?error=internal_server");
  }
};