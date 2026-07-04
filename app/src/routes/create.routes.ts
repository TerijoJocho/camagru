import { Router } from "express";

import { getStickers, createCapture } from "../controllers/create.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/stickers", authMiddleware, getStickers);
router.post("/capture", authMiddleware, createCapture);

export default router;
