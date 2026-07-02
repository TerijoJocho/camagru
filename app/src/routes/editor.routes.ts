import { Router } from "express";

import { getEditorStatus } from "../controllers/editor.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/", authMiddleware, getEditorStatus);

export default router;
