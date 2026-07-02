import type { Request, Response } from "express";
import { Picture } from "../models/picture.model";
import { Comment } from "../models/comment.model";
import { User } from "../models/user.model";
import { commentSchema } from "../validators/gallery.joi";
import { sendCommentEmail } from "../utils/sendCommentEmail";

/*
 * renvoie la page HTML de base (juste le squelette, sans images)
 * accessible à tous
 */
export const initGallery = (req: Request, res: Response) => {
  res.render("pages/gallery");
};

/*
 * renvoie du JSON avec les 5 images
 * appelée par JavaScript après le chargement de la page
 */
export const getPictures = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);

    const pictures = await Picture.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * 5)
      .limit(5)
      .populate("userId", "username")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username" },
      });
    const totalPages = await Picture.countDocuments();

    return res.json({
      pictures: pictures.map((pic) => ({
        _id: pic._id,
        filepath: pic.filepath,
        author: (pic.userId as any).username,
        likesCount: pic.likes.length,
        comments: (pic.comments as any[]).map((comment) => ({
          _id: comment._id,
          author: comment.userId?.username,
          content: comment.content,
          createdAt: comment.createdAt,
        })),
        createdAt: pic.createdAt,
      })),
      totalPages: Math.ceil(totalPages / 5),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
};

/*
 * like ou unlike un post lorsqu'un user est authentifié
 */
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const pictureId = req.params.id;

    const _id = req.user?._id;
    if (!_id) return res.status(401).json({ error: "user not authenticated" });

    const picture = await Picture.findById(pictureId);
    if (!picture)
      return res.status(404).json({ error: "picture doesn't exist" });

    const found = picture.likes.some((userId) => userId.equals(_id));
    if (found)
      await Picture.findByIdAndUpdate(pictureId, { $pull: { likes: _id } });
    else await Picture.findByIdAndUpdate(pictureId, { $push: { likes: _id } });

    const updatedPicture = await Picture.findById(pictureId);
    if (!updatedPicture)
      return res.status(404).json({ error: "picture doesn't exist" });

    return res.status(200).json({ likesCount: updatedPicture?.likes.length });
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
};

/*
 * créer un commentaire sous une picture
 */
export const commentPicture = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ error: "user not authenticated" });

    const pictureId = req.params.id;
    const picture = await Picture.findById(pictureId);
    if (!picture)
      return res.status(404).json({ error: "picture doesn't exist" });

    const { error, value } = commentSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: "comment doesn't fit the requirements" });

    const content = value.content;
    const newComment = await Comment.create({
      pictureId: pictureId,
      userId: userId,
      content: content,
    });

    await Picture.findByIdAndUpdate(pictureId, {
      $push: { comments: newComment._id },
    });

    const author = await User.findById(picture?.userId);
    const authorEmail = author?.email;

    if (author?.emailNotifications && authorEmail) {
      const sender = req.user?.username;
      await sendCommentEmail(authorEmail as string, sender as string, content);
    }

    res.status(200).json({ newComment: content });
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
};

/*
 * supprime un commentaire sous une picture
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ error: "user not authenticated" });

    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment)
      return res.status(404).json({ error: "comment doesn't exist" });

    if (!comment.userId.equals(userId))
      return res
        .status(401)
        .json({ error: "user can not delete this comment" });

    const pictureId = req.params.id;
    const picture = await Picture.findById(pictureId);
    if (!picture)
      return res.status(404).json({ error: "picture doesn't exist" });

    await Picture.findByIdAndUpdate(pictureId, {
      $pull: { comments: comment._id },
    });

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "comment successfully deleted" });
  } catch (error) {
    return res.status(500).json({ error: "internal server error" });
  }
};
