"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = loginController;
exports.meController = meController;
exports.forgotPasswordController = forgotPasswordController;
exports.resetPasswordController = resetPasswordController;
const auth_schemas_1 = require("./auth.schemas");
const auth_service_1 = require("./auth.service");
async function loginController(req, res) {
    try {
        const parsed = auth_schemas_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid payload",
                errors: parsed.error.flatten(),
            });
        }
        const { email, password } = parsed.data;
        const result = await (0, auth_service_1.loginUser)(email, password);
        return res.status(200).json(result);
    }
    catch (error) {
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
async function meController(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const currentUser = await (0, auth_service_1.getCurrentUser)(user.id);
        return res.status(200).json(currentUser);
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function forgotPasswordController(req, res) {
    try {
        const parsed = auth_schemas_1.forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        }
        await (0, auth_service_1.forgotPasswordService)(parsed.data.email);
        return res.status(200).json({ message: "Si el correo existe, se han enviado instrucciones." });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function resetPasswordController(req, res) {
    try {
        // 1. Imprimimos qué está llegando desde la app móvil
        console.log("1. PAYLOAD RECIBIDO EN BACKEND:", req.body);
        const parsed = auth_schemas_1.resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            // 2. Si Zod lo rechaza, imprimimos exactamente por qué
            console.log("2. ERRORES DE VALIDACIÓN ZOD:", parsed.error.flatten());
            return res.status(400).json({
                message: "Invalid payload",
                errors: parsed.error.flatten()
            });
        }
        await (0, auth_service_1.resetPasswordService)(parsed.data.token, parsed.data.newPassword);
        return res.status(200).json({ message: "Contraseña actualizada exitosamente" });
    }
    catch (error) {
        if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
            return res.status(400).json({ message: "El enlace de recuperación es inválido o ha expirado." });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
