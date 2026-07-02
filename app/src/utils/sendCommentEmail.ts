import {emailTransporter} from "./initEmailTransporter";

export const sendCommentEmail = async (email: string, sender: string, content: string) => {
  try {
    const info = await emailTransporter.sendMail({
      from: '"Camagru Team" <daril.avril@gmail.com>',
      to: email,
      subject: "You received a new comment on your picture !",
      text: `${sender} comment one of your picture: ${content}`,
      html: `<p>${sender} comment one of your picture: ${content}</p>`,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};
