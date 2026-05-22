import { Router } from "express";
import { 
  createUserController, 
  listUsersController, 
  updateUserController,
  getMeController,
  updateMeController,
  updateMyPasswordController
} from "./users.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

// ==========================================
// RUTAS DE MI PERFIL (Cualquier rol, pero requiere login)
// ==========================================
router.get("/me", requireAuth, getMeController);
router.put("/me", requireAuth, updateMeController);
router.put("/me/password", requireAuth, updateMyPasswordController);

// ==========================================
// RUTAS DE ADMIN (Gestión de equipo)
// ==========================================
router.post("/", requireAuth, requireRole("ADMIN"), createUserController);
router.get("/", requireAuth, requireRole("ADMIN"), listUsersController);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateUserController);

export default router;