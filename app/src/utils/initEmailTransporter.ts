const nodemailer = require("nodemailer");

export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const initEmailTransporter = async () => {
  try {
    await emailTransporter.verify();
    console.log("Server is ready to take our messages");
  } catch (err) {
    console.error("Verification failed:", err);
  }

  return emailTransporter;
};
