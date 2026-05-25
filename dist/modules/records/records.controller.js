"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecordController = createRecordController;
exports.listRecordsController = listRecordsController;
exports.updateRecordController = updateRecordController;
exports.deleteRecordController = deleteRecordController;
const records_schemas_1 = require("./records.schemas");
const records_service_1 = require("./records.service");
async function createRecordController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = records_schemas_1.createRecordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        }
        const record = await (0, records_service_1.createRecord)({ userId: user.id, ...parsed.data });
        return res.status(201).json(record);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "PHONE_OR_EMAIL_REQUIRED")
                return res.status(400).json({ message: "Phone, WhatsApp or email is required" });
            if (error.message === "INVALID_PHONE")
                return res.status(400).json({ message: "Invalid phone" });
            if (error.message === "INVALID_EMAIL")
                return res.status(400).json({ message: "Invalid email" });
            if (error.message === "DUPLICATE_BADGE") {
                return res.status(409).json({
                    message: "Este gafete ya fue registrado",
                    record: error.record,
                });
            }
        }
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
        const updated = await (0, records_service_1.updateRecord)(id, user.id, user.role, parsed.data);
        return res.status(200).json(updated);
    }
    catch (error) {
        if (error.message === "RECORD_NOT_FOUND")
            return res.status(404).json({ message: "Registro no encontrado" });
        if (error.message === "UNAUTHORIZED")
            return res.status(403).json({ message: "No tienes permiso para editar este registro" });
        if (error.message === "DUPLICATE_BADGE")
            return res.status(409).json({ message: "Este gafete ya fue registrado", record: error.record });
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
        return res.status(500).json({ message: "Internal server error" });
    }
}
