"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const records_routes_1 = __importDefault(require("./modules/records/records.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json({ limit: "8mb" }));
exports.app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
exports.app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
exports.app.use("/auth", auth_routes_1.default);
exports.app.use("/records", records_routes_1.default);
exports.app.use("/users", users_routes_1.default);
exports.app.use("/chat", chat_routes_1.default);
exports.app.use("/settings", settings_routes_1.default);
