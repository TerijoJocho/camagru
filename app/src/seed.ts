import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./models/user.model";
import { Picture } from "./models/picture.model";
import { Comment } from "./models/comment.model";

const MONGO_URI =
  process.env.MONGODB_URI ??
  process.env.MONGO_URI ??
  "mongodb://mongo:27017/camagru";
const SALT_ROUNDS = 10;

const NB_USERS = 5;
const FAKE_PICTURE_FILEPATH = "test.jpg";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  await User.deleteMany({});
  await Picture.deleteMany({});
  await Comment.deleteMany({});
  console.log("Collections cleared");

  const hashedPassword = await bcrypt.hash("secret12345", SALT_ROUNDS);

  const users = [];
  for (let i = 1; i <= NB_USERS; i++) {
    const user = await User.create({
      username: `testuser${i}`,
      email: `test${i}@gmail.com`,
      password: hashedPassword,
      accountConfirmed: true,
      emailNotifications: true,
    });
    users.push(user);
  }
  console.log(`${users.length} users created`);

  const pictures = [];
  for (const user of users) {
    const picture = await Picture.create({
      userId: user._id,
      filepath: FAKE_PICTURE_FILEPATH,
      likes: [],
      comments: [],
    });
    pictures.push(picture);
  }
  console.log(`${pictures.length} pictures created`);

  for (let i = 0; i < pictures.length; i++) {
    const picture = pictures[i];
    const owner = users[i];

    const otherUsers = users.filter((u) => !u._id.equals(owner._id));

    const commentIds = [];
    const likeIds = [];

    for (const commenter of otherUsers) {
      const comment = await Comment.create({
        pictureId: picture._id,
        userId: commenter._id,
        content: `Nice picture ${owner.username}, from ${commenter.username}!`,
      });
      commentIds.push(comment._id);
      likeIds.push(commenter._id);
    }

    await Picture.findByIdAndUpdate(picture._id, {
      comments: commentIds,
      likes: likeIds,
    });
  }
  console.log("Comments and likes attached to each picture");

  console.log("\nSeed completed. Login credentials for all users:");
  console.log("password: secret12345");
  users.forEach((u) => console.log(`- ${u.email} / ${u.username}`));

  await mongoose.disconnect();
  console.log("Disconnected");
}

seed().catch((err) => {
//   console.error("Seed failed:", err);
  process.exit(1);
});
