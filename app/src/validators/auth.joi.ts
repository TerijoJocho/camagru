import Joi from 'joi';

export const registerSchema = Joi.object({
    username: Joi.string().trim().alphanum().min(3).max(10).required(),
    email: Joi.string().trim().email({ minDomainSegments: 2, tlds: false }).required(),
    password: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
    confirmPassword: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().trim().email({ minDomainSegments: 2, tlds: false }).required(),
    password: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
});

export const emailSchema = Joi.object({
    email: Joi.string().trim().email({minDomainSegments: 2, tlds: false}).required(),
});

export const resetPasswordSchema = Joi.object({
    password: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
    confirmPassword: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
    newPassword: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
    confirmNewPassword: Joi.string().trim().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
});

export const updateProfileSchema = Joi.object({
    username:Joi.string().trim().alphanum().min(3).max(10).empty('').optional(),
    email:Joi.string().trim().email({ minDomainSegments: 2, tlds: false }).empty('').optional(),
});