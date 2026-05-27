"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettingsController = getSettingsController;
exports.updateSettingsController = updateSettingsController;
const zod_1 = require("zod");
const settings_service_1 = require("./settings.service");
const updateSettingsSchema = zod_1.z.object({
    manualEventDefault: zod_1.z.string().min(1).max(80).optional(),
});
async function getSettingsController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const settings = await (0, settings_service_1.getAppSettings)();
        return res.status(200).json(settings);
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateSettingsController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = updateSettingsSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const settings = await (0, settings_service_1.updateAppSettings)(parsed.data);
        return res.status(200).json(settings);
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
}
