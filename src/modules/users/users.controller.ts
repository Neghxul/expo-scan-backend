import { Request, Response } from "express";
import { createUserSchema, updateUserSchema, updateMeSchema, updatePasswordSchema } from "./users.schemas";
import { createUser, listUsers, updateUser, getMe, updateMe, updateMyPassword } from "./users.service";

export async function createUserController(req: Request, res: Response) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    const user = await createUser(parsed.data);
    return res.status(201).json(user);
  } catch (error: any) {
    if (error.message === "EMAIL_ALREADY_EXISTS") return res.status(409).json({ message: "El correo ya existe" });
    console.error("[users:create]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listUsersController(req: Request, res: Response) {
  try {
    const users = await listUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error("[users:list]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUserController(req: Request, res: Response) {
  try {
    // 1️⃣ SOLUCIÓN: Forzamos a que el ID sea leído como string
    const id = req.params.id as string; 
    
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    const user = await updateUser(id, parsed.data);
    return res.status(200).json(user);
  } catch (error) {
    console.error("[users:update]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Controladores para MI PERFIL
export async function getMeController(req: Request | any, res: Response) {
  try {
    // 2️⃣ SOLUCIÓN: Forzamos el userId a string
    const userId = req.user?.id as string; 
    
    const user = await getMe(userId);
    return res.status(200).json(user);
  } catch (error) {
    console.error("[users:me]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateMeController(req: Request | any, res: Response) {
  try {
    // 3️⃣ SOLUCIÓN: Forzamos el userId a string
    const userId = req.user?.id as string; 
    
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    const user = await updateMe(userId, parsed.data);
    return res.status(200).json(user);
  } catch (error) {
    console.error("[users:update-me]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateMyPasswordController(req: Request | any, res: Response) {
  try {
    // 4️⃣ SOLUCIÓN: Forzamos el userId a string
    const userId = req.user?.id as string; 
    
    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

    await updateMyPassword(userId, parsed.data.oldPassword, parsed.data.newPassword);
    return res.status(200).json({ message: "Password updated" });
  } catch (error: any) {
    if (error.message === "INVALID_OLD_PASSWORD") return res.status(400).json({ message: "Contraseña actual incorrecta" });
    console.error("[users:update-password]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
