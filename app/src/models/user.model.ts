import { Schema, model } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        confirmationToken: {
            type: String,
            default: null,
        },
        accountConfirmed: {
            type: Boolean,
            default: false,
        },
        forgotPasswordToken: {
            type: String,
            default: null,
        },
        emailNotifications: {
            type: Boolean,
            default:true,
        }
    }, 
    {
        timestamps: true
    }
);

export const User = model("User", userSchema);
