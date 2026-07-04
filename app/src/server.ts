import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from "cors";
import path from "node:path";

import pagesRoutes from "./routes/pages.routes";
import authRoutes from "./routes/auth.routes";
import createRoutes from "./routes/create.routes";
import galleryRoutes from "./routes/gallery.routes";
import { initEmailTransporter } from "./utils/initEmailTransporter";

const app = express();
const port = parseInt(process.env.PORT ?? "3000", 10);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://mongo:27017/camagru";

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "dist/public")));
app.use(express.static(path.join(process.cwd(), "src/public")));
app.use(
  cors({
    origin: "http://localhost:3000", // à changer
    credentials: true,
  }),
);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use("/pages", pagesRoutes);
app.use("/auth", authRoutes);
app.use("/create", createRoutes);
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
