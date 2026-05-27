// Archivo: src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas";
import { getCurrentUser, loginUser, forgotPasswordService, resetPasswordService } from "./auth.service";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export async function loginController(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payload",
        errors: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    return res.status(200).json(result);
  } catch (error: any) {
    // Imprimimos el error en el servidor
    console.error("💥 ERROR REAL EN LOGIN:", error);

    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Le mandamos el error crudo a tu celular (solo temporalmente para debug)
    return res.status(500).json({ 
      message: "Internal server error", 
      detalle: error.message,
      stack: error.stack 
    });
  }
}

export async function meController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await getCurrentUser(user.id);

    return res.status(200).json(currentUser);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    }

    await forgotPasswordService(parsed.data.email);

    return res.status(200).json({ message: "Si el correo existe, se han enviado instrucciones." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    // 1. Imprimimos qué está llegando desde la app móvil
    console.log("1. PAYLOAD RECIBIDO EN BACKEND:", req.body); 

    const parsed = resetPasswordSchema.safeParse(req.body);
    
    if (!parsed.success) {
      // 2. Si Zod lo rechaza, imprimimos exactamente por qué
      console.log("2. ERRORES DE VALIDACIÓN ZOD:", parsed.error.flatten());
      return res.status(400).json({ 
        message: "Invalid payload", 
        errors: parsed.error.flatten() 
      });
    }

    await resetPasswordService(parsed.data.token, parsed.data.newPassword);

    return res.status(200).json({ message: "Contraseña actualizada exitosamente" });
  } catch (error: any) {
    if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
      return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado." });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}