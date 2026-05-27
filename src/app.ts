import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes  from "./modules/auth/auth.routes";
import recordRoutes from "./modules/records/records.routes";
import userRoutes from "./modules/users/users.routes";
import chatRoutes from "./modules/chat/chat.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import { getUploadsRoot } from "./utils/imageUpload";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use("/uploads", express.static(getUploadsRoot()));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/records", recordRoutes);
app.use("/users", userRoutes);
app.use("/chat", chatRoutes);
app.use("/settings", settingsRoutes);
