"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.updateMeSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    // Agregamos los nuevos roles aquí:
    role: zod_1.z.enum(["SELLER", "ADMIN", "MANAGER", "DIRECTOR", "MARKETING"]).optional(),
    lastName: zod_1.z.string().optional(),
    maternalLastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    avatarBase64: zod_1.z.string().optional().nullable(),
    avatarMimeType: zod_1.z.string().optional().nullable(),
    birthDate: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(8).optional(),
    // Y también aquí:
    role: zod_1.z.enum(["SELLER", "ADMIN", "MANAGER", "DIRECTOR", "MARKETING"]).optional(),
    lastName: zod_1.z.string().optional(),
    maternalLastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    avatarBase64: zod_1.z.string().optional().nullable(),
    avatarMimeType: zod_1.z.string().optional().nullable(),
    birthDate: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateMeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().optional(),
    maternalLastName: zod_1.z.string().optional(),
    birthDate: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    avatarBase64: zod_1.z.string().optional().nullable(),
    avatarMimeType: zod_1.z.string().optional().nullable(),
});
exports.updatePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
