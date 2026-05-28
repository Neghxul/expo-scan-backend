import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { isChatEnabled } from "../settings/settings.service";

export async function requireChatEnabled(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (await isChatEnabled()) return next();
    return res.status(423).json({ message: "Chat deshabilitado temporalmente" });
  } catch (error) {
    console.error("[chat:enabled]", error);
    return res.status(503).json({ message: "Chat no disponible" });
  }
}
