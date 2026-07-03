import { Router } from "express";

import { getEditorStatus, getStickers } from "../controllers/create.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/", authMiddleware, getEditorStatus);
router.get("/stickers", authMiddleware, getStickers);

export default router;
