import { Router } from "express";

import { initGallery, getPictures, toggleLike, commentPicture, deleteComment } from "../controllers/gallery.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/", initGallery);
router.get("/pictures", getPictures);
router.post("/pictures/:id/like", authMiddleware, toggleLike);
router.post("/pictures/:id/comment", authMiddleware, commentPicture);
router.delete("/pictures/:id/comment/:commentId", authMiddleware, deleteComment);

export default router;
