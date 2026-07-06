import { Router } from "express";

import { getStickers, createCapture, getUserPictures, deletePicture } from "../controllers/create.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/stickers", authMiddleware, getStickers);
router.post("/capture", authMiddleware, createCapture);
router.get("/user-pictures", authMiddleware, getUserPictures);
router.post("/delete", authMiddleware, deletePicture);

export default router;
