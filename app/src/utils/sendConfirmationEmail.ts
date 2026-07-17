import {emailTransporter} from "./initEmailTransporter";

export const sendConfirmationEmail = async (email: string, token: string) => {
  try {
    const info = await emailTransporter.sendMail({
      from: '"Camagru Team" <daril.avril@gmail.com>',
      to: email,
      subject: "Account confirmation email",
      text: `Please click on this URL to confirm your email: https://localhost:4433/auth/confirm?token=${token}`,
      html: `<p>Please click on this URL to confirm your email:</p><p><a href="https://localhost:4433/auth/confirm?token=${token}">Confirm my email</a></p>`,
    });

    // console.log("Message sent: %s", info.messageId);
	void info;
  } catch (err) {
    // console.error("Error while sending mail:", err);
	void err;
  }
};
