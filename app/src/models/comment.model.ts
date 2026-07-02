import { Schema, model } from "mongoose";

const commentSchema = new Schema(
    {
        pictureId: {
            type: Schema.Types.ObjectId,
            ref: "Picture",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

export const Comment = model("Comment", commentSchema);
