import type { Request, Response } from "express";
import { Picture } from "../models/picture.model";
import { Comment } from "../models/comment.model";
import { User } from "../models/user.model";
import { commentSchema } from "../validators/gallery.joi";
import { sendCommentEmail } from "../utils/sendCommentEmail";

const redirectWithMessage = (
  res: Response,
  target: string,
  type: "error" | "success",
  message: string,
) => {
  const separator = target.includes("?") ? "&" : "?";

  return res.redirect(
    `${target}${separator}${type}=${encodeURIComponent(message)}`,
  );
};

const getRefererPath = (req: Request, fallback: string) => {
  const referer = req.get("referer");

  if (!referer) return fallback;

  try {
    const refererUrl = new URL(referer);

    return `${refererUrl.pathname}${refererUrl.search}`;
  } catch {
    return fallback;
  }
};

/*
 * renvoie la page HTML de base (juste le squelette, sans images)
 * accessible à tous
 */
export const initGallery = (req: Request, res: Response) => {
  return res.redirect("/pages/gallery");
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
        options: { sort: { createdAt: -1 } },
        populate: { path: "userId", select: "username" },
      });
    const totalPictures = await Picture.countDocuments();

    return res.json({
      pictures: pictures.map((pic) => ({
        _id: pic._id,
        filepath: pic.filepath.startsWith("/uploads/")
          ? pic.filepath
          : `/uploads/${pic.filepath}`,
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
      totalPages: Math.ceil(totalPictures / 5),
      currentPage: page,
    });
  } catch (error) {
    return res.redirect("/pages/gallery?error=internal_server_error");
  }
};

/*
 * like ou unlike un post lorsqu'un user est authentifié
 */
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const pictureId = req.params.id;
    const fallbackTarget = `/pages/gallery/${pictureId}`;
    const redirectTarget = getRefererPath(req, fallbackTarget);

    const _id = res.locals.user?._id;
    if (!_id)
      return redirectWithMessage(
        res,
        "/pages/login",
        "error",
        "not_authenticated",
      );

    const picture = await Picture.findById(pictureId);
    if (!picture)
      return redirectWithMessage(
        res,
        "/pages/gallery",
        "error",
        "post_not_found",
      );

    const found = picture.likes.some((userId) => userId.equals(_id));
    if (found)
      await Picture.findByIdAndUpdate(pictureId, { $pull: { likes: _id } });
    else await Picture.findByIdAndUpdate(pictureId, { $push: { likes: _id } });

    return res.redirect(redirectTarget);
  } catch (error) {
    return res.redirect("/pages/gallery?error=internal_server_error");
  }
};

/*
 * créer un commentaire sous une picture
 */
export const commentPicture = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user?._id;
    if (!userId) return res.redirect("/pages/login?error=not_authenticated");

    const pictureId = req.params.id;
    const picture = await Picture.findById(pictureId);
    if (!picture)
      return redirectWithMessage(
        res,
        "/pages/gallery",
        "error",
        "post_not_found",
      );

    const { error, value } = commentSchema.validate(req.body);
    if (error)
      return redirectWithMessage(
        res,
        `/pages/gallery/${pictureId}`,
        "error",
        "invalid_comment_data",
      );

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
      await sendCommentEmail(authorEmail as string, sender as string, content);
    }

    return redirectWithMessage(
      res,
      `/pages/gallery/${pictureId}`,
      "success",
      "comment_added",
    );
  } catch (error) {
    return res.redirect("/pages/gallery?error=internal_server_error");
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
      return redirectWithMessage(
        res,
        "/pages/gallery",
        "error",
        "comment_not_found",
      );

    if (!comment.userId.equals(res.locals.user?._id))
      return redirectWithMessage(
        res,
        `/pages/gallery/${req.params.id}`,
        "error",
        "comment_delete_not_allowed",
      );

    const pictureId = req.params.id;
    const picture = await Picture.findById(pictureId);
    if (!picture)
      return redirectWithMessage(
        res,
        "/pages/gallery",
        "error",
        "post_not_found",
      );

    await Picture.findByIdAndUpdate(pictureId, {
      $pull: { comments: comment._id },
    });

    await Comment.findByIdAndDelete(commentId);

    return redirectWithMessage(
      res,
      `/pages/gallery/${pictureId}`,
      "success",
      "comment_deleted",
    );
  } catch (error) {
    return res.redirect("/pages/gallery?error=internal_server_error");
  }
};
