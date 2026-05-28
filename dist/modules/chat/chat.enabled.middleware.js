"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireChatEnabled = requireChatEnabled;
const settings_service_1 = require("../settings/settings.service");
async function requireChatEnabled(_req, res, next) {
    try {
        if (await (0, settings_service_1.isChatEnabled)())
            return next();
        return res.status(423).json({ message: "Chat deshabilitado temporalmente" });
    }
    catch (error) {
        console.error("[chat:enabled]", error);
        return res.status(503).json({ message: "Chat no disponible" });
    }
}
