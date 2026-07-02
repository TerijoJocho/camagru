import type { Request, Response } from "express";

import { Comment } from "../models/comment.model";
import { Picture } from "../models/picture.model";

export const getEditorStatus = (_req: Request, res: Response) => {
	void Comment;
	void Picture;
	res.json({ status: "ok" });
};
