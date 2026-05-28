"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
// ==========================================
// RUTAS DE MI PERFIL (Cualquier rol, pero requiere login)
// ==========================================
router.get("/me", auth_middleware_1.requireAuth, users_controller_1.getMeController);
router.put("/me", auth_middleware_1.requireAuth, users_controller_1.updateMeController);
router.put("/me/password", auth_middleware_1.requireAuth, users_controller_1.updateMyPasswordController);
// ==========================================
// RUTAS DE ADMIN (Gestión de equipo)
// ==========================================
router.post("/", auth_middleware_1.requireAuth, (0, role_middleware_1.requireRole)("ADMIN"), users_controller_1.createUserController);
router.get("/", auth_middleware_1.requireAuth, (0, role_middleware_1.requireRole)("ADMIN"), users_controller_1.listUsersController);
router.put("/:id", auth_middleware_1.requireAuth, (0, role_middleware_1.requireRole)("ADMIN"), users_controller_1.updateUserController);
exports.default = router;
