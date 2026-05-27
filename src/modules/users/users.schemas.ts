import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  // Agregamos los nuevos roles aquí:
  role: z.enum(["SELLER", "ADMIN", "MANAGER", "DIRECTOR", "MARKETING"]).optional(),
  lastName: z.string().optional(),
  maternalLastName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  avatarBase64: z.string().optional().nullable(),
  avatarMimeType: z.string().optional().nullable(),
  birthDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  // Y también aquí:
  role: z.enum(["SELLER", "ADMIN", "MANAGER", "DIRECTOR", "MARKETING"]).optional(),
  lastName: z.string().optional(),
  maternalLastName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  avatarBase64: z.string().optional().nullable(),
  avatarMimeType: z.string().optional().nullable(),
  birthDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  lastName: z.string().optional(),
  maternalLastName: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  avatarBase64: z.string().optional().nullable(),
  avatarMimeType: z.string().optional().nullable(),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
