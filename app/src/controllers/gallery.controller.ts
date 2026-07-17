import type { Request, Response } from "express";
import { Picture } from "../models/picture.model";
import { Comment } from "../models/comment.model";
import { User } from "../models/user.model";
import { commentSchema } from "../validators/gallery.joi";
import { sendCommentEmail } from "../utils/sendCommentEmail";

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
        options: { sort: { createdAt: -1 } },
        populate: { path: "userId", select: "username" },
      });
    const totalPictures = await Picture.countDocuments();

    return res.status(200).json({
      pictures: pictures.map((pic) => ({
        _id: pic._id,
        filepath: pic.filepath.startsWith("/uploads/")
          ? pic.filepath
          : `/uploads/${pic.filepath}`,
        author: (pic.userId as any).username,
        likesCount: pic.likes.length,
        comments: (pic.comments as any[]).map((comment) => ({
          _id: comment._id,
          userId: comment.userId,
          author: comment.userId?.username,
          content: comment.content,
          createdAt: comment.createdAt,
        })),
        createdAt: pic.createdAt,
      })),
      totalPages: Math.ceil(totalPictures / 5),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};

/*
 * like ou unlike un post lorsqu'un user est authentifié
 */
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const pictureId = req.params.id;

    const _id = res.locals.user?._id;
    if (!_id)
      return res.status(401).json({ error: "not_authenticated" });

    const picture = await Picture.findById(pictureId);
    if (!picture)
      return res.status(404).json({error: "post_not_found"});

    const found = picture.likes.some((userId) => userId.equals(_id));
    if (found)
      await Picture.findByIdAndUpdate(pictureId, { $pull: { likes: _id } });
    else await Picture.findByIdAndUpdate(pictureId, { $push: { likes: _id } });

    const updatedPicture = await Picture.findById(pictureId);
    const likesCount = updatedPicture?.likes.length ?? 0;
    const isLiked = updatedPicture?.likes.some((userId) => userId.equals(_id)) ?? false;

    return res.status(200).json({
      success: "like_toggled",
      likesCount,
      isLiked,
    });

  } catch (error) {
    return res.status(500).json({
      error: "internal_server_error",
    });
  }
};

/*
 * créer un commentaire sous une picture
 */
export const commentPicture = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user?._id;
    if (!userId)
      return res.status(401).json({ error: "not_authenticated" });

    const pictureId = req.params.id;
    const picture = await Picture.findById(pictureId);
    if (!picture)
      return res.status(404).json({ error: "post_not_found", redirect: "/pages/gallery" });

    const { error, value } = commentSchema.validate(req.body);
    if (error)
      return res.status(400).json({ error: "invalid_comment_data" });

    const content = value.comment;
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
      const sender = res.locals.user?.username;
      if (sender !== author.username)
        await sendCommentEmail(authorEmail as string, sender as string, content);
    }

    return res.status(201).json({
      success: "comment_added",
      comment: {
        _id: newComment._id,
        userId: newComment.userId,
        content,
        author: res.locals.user?.username,
        createdAt: newComment.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "internal_server_error" });
  }
};

/*
 * supprime un commentaire sous une picture
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment)
      return res.status(404).json({ error: "comment_not_found", redirect: "/pages/gallery" });

    if (!comment.userId.equals(res.locals.user?._id))
      return res.status(403).json({ error: "comment_delete_not_allowed" });

    const pictureId = req.params.id;
    const picture = await Picture.findById(pictureId);
    if (!picture)
      return res.status(404).json({ error: "post_not_found", redirect: "/pages/gallery" });

    await Picture.findByIdAndUpdate(pictureId, {
      $pull: { comments: comment._id },
    });

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: "comment_deleted",
    });
  } catch (error) {
    return res.status(500).json({ error: "internal_server_error" });
  }
};
