import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from "cors";

import pagesRoutes from "./routes/pages.routes";
import authRoutes from "./routes/auth.routes";
import editorRoutes from "./routes/editor.routes";
import galleryRoutes from "./routes/gallery.routes";
import { initEmailTransporter } from "./utils/initEmailTransporter";

const app = express();
const port = parseInt(process.env.PORT ?? "3000", 10);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://mongo:27017/camagru";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("src/public"));
app.use(
  cors({
    origin: "http://localhost:3000", // à changer
    credentials: true,
  }),
);
app.use("/uploads", express.static("uploads"));

app.set("view engine", "ejs");
app.set("views", "./views");

app.use("/pages", pagesRoutes);
app.use("/auth", authRoutes);
app.use("/editor", editorRoutes);
app.use("/gallery", galleryRoutes);

async function start() {
  await mongoose.connect(mongoUri);
  await initEmailTransporter();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
