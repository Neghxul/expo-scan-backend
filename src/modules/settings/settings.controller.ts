import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { getAppSettings, updateAppSettings } from "./settings.service";

const updateSettingsSchema = z.object({
  manualEventDefault: z.string().min(1).max(80).optional(),
  chatEnabled: z.boolean().optional(),
});

export async function getSettingsController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const settings = await getAppSettings();
    return res.status(200).json(settings);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateSettingsController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    const settings = await updateAppSettings(parsed.data);
    return res.status(200).json(settings);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}
