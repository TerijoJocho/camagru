import {emailTransporter} from "./initEmailTransporter";

export const sendForgotPasswordEmail = async (email: string, token: string) => {
  try {
    const info = await emailTransporter.sendMail({
      from: '"Camagru Team" <daril.avril@gmail.com>',
      to: email,
      subject: "Password reseting email",
      text: `Click on this URL to reset your password: https://localhost:4433/auth/reset-password?token=${token}`,
      html: `<p>Click on this URL to reset your password:</p><p><a href="https://localhost:4433/auth/reset-password?token=${token}">Reset my password</a></p>`,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};
