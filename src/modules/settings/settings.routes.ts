import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { getSettingsController, updateSettingsController } from "./settings.controller";

const router = Router();

router.get("/", requireAuth, getSettingsController);
router.put("/", requireAuth, requireRole(Role.ADMIN), updateSettingsController);

export default router;
