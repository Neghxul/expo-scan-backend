"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = loginUser;
exports.getCurrentUser = getCurrentUser;
exports.forgotPasswordService = forgotPasswordService;
exports.resetPasswordService = resetPasswordService;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const resend_1 = require("resend");
const prisma_1 = require("../../config/prisma");
const jwt_1 = require("../../utils/jwt");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_super_seguro";
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.isActive) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const ok = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!ok) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const token = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        },
    };
}
async function getCurrentUser(userId) {
    return prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            avatarUrl: true,
            createdAt: true,
        },
    });
}
async function forgotPasswordService(email) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
    });
    // Por seguridad, si el usuario no existe no damos error, simulamos éxito para que no adivinen correos
    if (!user || !user.isActive) {
        return { success: true };
    }
    // Creamos un token temporal que caduca en 15 minutos
    const resetToken = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    // Enviamos el correo con Resend
    const { error } = await resend.emails.send({
        from: 'Soporte Robuspack <soporte@mail.robuspackrefacciones.com>',
        to: [user.email],
        subject: 'Recuperación de Contraseña - App Eventos',
        html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Hola ${user.name},</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña en la App de Eventos de Robuspack.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva (Este enlace expira en 15 minutos):</p>
        <br/>
        <a href="https://tudominio.com/reset-password?token=${resetToken}" 
           style="background-color: #2596be; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          Restablecer Contraseña
        </a>
        <br/><br/>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Si no solicitaste este cambio, ignora este correo y tu contraseña seguirá siendo la misma.
        </p>
      </div>
    `
    });
    if (error) {
        console.error("Error enviando correo con Resend:", error);
        throw new Error("EMAIL_SEND_FAILED");
    }
    return { success: true };
}
async function resetPasswordService(token, newPassword) {
    try {
        // Asegúrate de que el JWT_SECRET sea exactamente el mismo que usaste arriba en forgotPasswordService
        const secret = process.env.JWT_SECRET || "tu_secreto_super_seguro";
        // 1. Verificamos el token
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // 2. Encriptamos la nueva contraseña
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        // 3. Actualizamos en la BD
        await prisma_1.prisma.user.update({
            where: { id: decoded.id },
            data: { passwordHash }
        });
        return { success: true };
    }
    catch (error) {
        // 🔥 AQUÍ ESTÁ LA MAGIA: Esto imprimirá el error real en tu terminal
        console.error("🔥 ERROR REAL EN EL SERVICIO DE RESET:", error);
        throw new Error("INVALID_OR_EXPIRED_TOKEN");
    }
}
