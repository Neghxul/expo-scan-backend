"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const authRoutes = (0, express_1.Router)();
authRoutes.post("/login", auth_controller_1.loginController);
authRoutes.post("/forgot-password", auth_controller_1.forgotPasswordController);
authRoutes.post("/reset-password", auth_controller_1.resetPasswordController); // <-- NUEVA RUTA AQUÍ
authRoutes.get("/me", auth_middleware_1.requireAuth, auth_controller_1.meController);
exports.default = authRoutes;
