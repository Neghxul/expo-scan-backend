import { Router } from "express";
import { loginController, meController, forgotPasswordController, resetPasswordController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware"; 

const authRoutes = Router();

authRoutes.post("/login", loginController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password", resetPasswordController); // <-- NUEVA RUTA AQUÍ
authRoutes.get("/me", requireAuth, meController);

export default authRoutes;