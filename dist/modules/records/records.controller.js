"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecordController = createRecordController;
exports.listRecordsController = listRecordsController;
exports.updateRecordController = updateRecordController;
exports.deleteRecordController = deleteRecordController;
const records_schemas_1 = require("./records.schemas");
const records_service_1 = require("./records.service");
function getBaseUrl(req) {
    const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    return `${protocol}://${req.get("host")}`;
}
async function createRecordController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = records_schemas_1.createRecordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        }
        const record = await (0, records_service_1.createRecord)({ userId: user.id, ...parsed.data, baseUrl: getBaseUrl(req) });
        return res.status(201).json(record);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "POSITION_REQUIRED")
                return res.status(400).json({ message: "El puesto es obligatorio" });
            if (error.message === "NOTES_REQUIRED")
                return res.status(400).json({ message: "Las notas son obligatorias" });
            if (error.message === "PRIORITY_REQUIRED")
                return res.status(400).json({ message: "Selecciona prioridad 01, 02 o 03" });
            if (error.message === "WHATSAPP_REQUIRED")
                return res.status(400).json({ message: "El WhatsApp es obligatorio" });
            if (error.message === "PHONE_REQUIRED")
                return res.status(400).json({ message: "El telefono es obligatorio" });
            if (error.message === "EMAIL_REQUIRED")
                return res.status(400).json({ message: "El correo es obligatorio" });
            if (error.message === "PHONE_OR_EMAIL_REQUIRED")
                return res.status(400).json({ message: "Phone, WhatsApp or email is required" });
            if (error.message === "INVALID_PHONE")
                return res.status(400).json({ message: "Invalid phone" });
            if (error.message === "INVALID_EMAIL")
                return res.status(400).json({ message: "Invalid email" });
            if (error.message === "BUSINESS_CARD_TOO_LARGE")
                return res.status(400).json({ message: "La imagen de tarjeta es demasiado grande" });
            if (error.message === "DUPLICATE_BADGE") {
                return res.status(409).json({
                    message: "Este gafete ya fue registrado",
                    record: error.record,
                });
            }
        }
        console.error("[records:create]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function listRecordsController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = records_schemas_1.listRecordsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid query params", errors: parsed.error.flatten() });
        }
        const records = await (0, records_service_1.listRecords)({
            requesterId: user.id,
            requesterRole: user.role,
            ...parsed.data,
        });
        return res.status(200).json(records);
    }
    catch (error) {
        console.error("[records:list]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateRecordController(req, res) {
    try {
        const id = req.params.id;
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = records_schemas_1.updateRecordSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const updated = await (0, records_service_1.updateRecord)(id, user.id, user.role, parsed.data, getBaseUrl(req));
        return res.status(200).json(updated);
    }
    catch (error) {
        if (error.message === "RECORD_NOT_FOUND")
            return res.status(404).json({ message: "Registro no encontrado" });
        if (error.message === "UNAUTHORIZED")
            return res.status(403).json({ message: "No tienes permiso para editar este registro" });
        if (error.message === "DUPLICATE_BADGE")
            return res.status(409).json({ message: "Este gafete ya fue registrado", record: error.record });
        if (error.message === "POSITION_REQUIRED")
            return res.status(400).json({ message: "El puesto es obligatorio" });
        if (error.message === "NOTES_REQUIRED")
            return res.status(400).json({ message: "Las notas son obligatorias" });
        if (error.message === "PRIORITY_REQUIRED")
            return res.status(400).json({ message: "Selecciona prioridad 01, 02 o 03" });
        if (error.message === "WHATSAPP_REQUIRED")
            return res.status(400).json({ message: "El WhatsApp es obligatorio" });
        if (error.message === "PHONE_REQUIRED")
            return res.status(400).json({ message: "El telefono es obligatorio" });
        if (error.message === "EMAIL_REQUIRED")
            return res.status(400).json({ message: "El correo es obligatorio" });
        if (error.message === "INVALID_PHONE")
            return res.status(400).json({ message: "Invalid phone" });
        if (error.message === "INVALID_EMAIL")
            return res.status(400).json({ message: "Invalid email" });
        if (error.message === "BUSINESS_CARD_TOO_LARGE")
            return res.status(400).json({ message: "La imagen de tarjeta es demasiado grande" });
        console.error("[records:update]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function deleteRecordController(req, res) {
    try {
        const id = req.params.id;
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        await (0, records_service_1.deleteRecord)(id, user.id, user.role);
        return res.status(200).json({ message: "Registro eliminado exitosamente" });
    }
    catch (error) {
        if (error.message === "RECORD_NOT_FOUND")
            return res.status(404).json({ message: "Registro no encontrado" });
        if (error.message === "UNAUTHORIZED")
            return res.status(403).json({ message: "No tienes permiso para eliminar este registro" });
        console.error("[records:delete]", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
