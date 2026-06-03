"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserController = createUserController;
exports.listUsersController = listUsersController;
exports.updateUserController = updateUserController;
exports.getMeController = getMeController;
exports.updateMeController = updateMeController;
exports.updateMyPasswordController = updateMyPasswordController;
const users_schemas_1 = require("./users.schemas");
const users_service_1 = require("./users.service");
function getBaseUrl(req) {
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    return `${protocol}://${req.get("host")}`;
}
async function createUserController(req, res) {
    try {
        const parsed = users_schemas_1.createUserSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const user = await (0, users_service_1.createUser)({ ...parsed.data, baseUrl: getBaseUrl(req) });
        return res.status(201).json(user);
    }
    catch (error) {
        if (error.message === "EMAIL_ALREADY_EXISTS")
            return res.status(409).json({ message: "El correo ya existe" });
        console.error("[users:create]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function listUsersController(req, res) {
    try {
        const users = await (0, users_service_1.listUsers)();
        return res.status(200).json(users);
    }
    catch (error) {
        console.error("[users:list]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateUserController(req, res) {
    try {
        // 1️⃣ SOLUCIÓN: Forzamos a que el ID sea leído como string
        const id = req.params.id;
        const parsed = users_schemas_1.updateUserSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const user = await (0, users_service_1.updateUser)(id, { ...parsed.data, baseUrl: getBaseUrl(req) });
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("[users:update]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// Controladores para MI PERFIL
async function getMeController(req, res) {
    try {
        // 2️⃣ SOLUCIÓN: Forzamos el userId a string
        const userId = req.user?.id;
        const user = await (0, users_service_1.getMe)(userId);
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("[users:me]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateMeController(req, res) {
    try {
        // 3️⃣ SOLUCIÓN: Forzamos el userId a string
        const userId = req.user?.id;
        const parsed = users_schemas_1.updateMeSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const user = await (0, users_service_1.updateMe)(userId, { ...parsed.data, baseUrl: getBaseUrl(req) });
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("[users:update-me]", error);
        if (error.message === "IMAGE_TOO_LARGE")
            return res.status(400).json({ message: "La foto es demasiado grande" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateMyPasswordController(req, res) {
    try {
        // 4️⃣ SOLUCIÓN: Forzamos el userId a string
        const userId = req.user?.id;
        const parsed = users_schemas_1.updatePasswordSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        await (0, users_service_1.updateMyPassword)(userId, parsed.data.oldPassword, parsed.data.newPassword);
        return res.status(200).json({ message: "Password updated" });
    }
    catch (error) {
        if (error.message === "INVALID_OLD_PASSWORD")
            return res.status(400).json({ message: "Contraseña actual incorrecta" });
        console.error("[users:update-password]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
