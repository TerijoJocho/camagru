import Joi from 'joi';

export const commentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(200).required(),
});