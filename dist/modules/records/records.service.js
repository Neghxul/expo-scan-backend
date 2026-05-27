"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecord = createRecord;
exports.listRecords = listRecords;
exports.updateRecord = updateRecord;
exports.deleteRecord = deleteRecord;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const prisma_1 = require("../../config/prisma");
const settings_service_1 = require("../settings/settings.service");
function isValidEmail(email) {
    if (!email)
        return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isValidPhone(phone) {
    if (!phone)
        return true;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 7;
}
function canSeeAllRecords(role) {
    return ["ADMIN", "MANAGER", "DIRECTOR", "MARKETING"].includes(role);
}
function canEditRecord(role, ownerId, requesterId) {
    if (role === "ADMIN" || role === "DIRECTOR")
        return true;
    return role === "SELLER" && ownerId === requesterId;
}
function canDeleteRecord(role, ownerId, requesterId) {
    if (role === "ADMIN" || role === "DIRECTOR")
        return true;
    return role === "SELLER" && ownerId === requesterId;
}
function validateRequiredFields(fields) {
    if (!fields.Puesto?.trim())
        throw new Error("POSITION_REQUIRED");
    if (!fields.Notas?.trim())
        throw new Error("NOTES_REQUIRED");
    if (!["01", "02", "03"].includes(fields.LeadPriority || ""))
        throw new Error("PRIORITY_REQUIRED");
}
async function saveBusinessCardImage(base64, mimeType, baseUrl) {
    if (!base64?.trim())
        return null;
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    if (buffer.length > 2500000)
        throw new Error("BUSINESS_CARD_TOO_LARGE");
    const extension = mimeType?.includes("png") ? "png" : "jpg";
    const dir = path_1.default.join(process.cwd(), "uploads", "business-cards");
    await promises_1.default.mkdir(dir, { recursive: true });
    const fileName = `${Date.now()}-${(0, crypto_1.randomUUID)()}.${extension}`;
    await promises_1.default.writeFile(path_1.default.join(dir, fileName), buffer);
    return `${baseUrl || ""}/uploads/business-cards/${fileName}`;
}
async function createRecord(params) {
    const { userId, qrRaw, badgeNumber, eventName, fields, phone, email } = params;
    const hasOne = Boolean(phone?.trim()) || Boolean(email?.trim()) || Boolean(fields?.Whatsapp?.trim());
    let normalizedBadge = badgeNumber?.trim() || null;
    let normalizedEvent = eventName?.trim() || null;
    if (params.isManual) {
        if (!normalizedBadge || /^MAN/i.test(normalizedBadge))
            normalizedBadge = await (0, settings_service_1.reserveManualBadgeNumber)();
        if (!normalizedEvent)
            normalizedEvent = await (0, settings_service_1.getManualEventDefault)();
    }
    validateRequiredFields(fields);
    if (!hasOne)
        throw new Error("PHONE_OR_EMAIL_REQUIRED");
    if (!isValidPhone(phone))
        throw new Error("INVALID_PHONE");
    if (!isValidEmail(email))
        throw new Error("INVALID_EMAIL");
    if (normalizedBadge && normalizedEvent) {
        const existing = await prisma_1.prisma.record.findFirst({
            where: {
                badgeNumber: normalizedBadge,
                eventName: normalizedEvent,
            },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
            },
        });
        if (existing) {
            const error = new Error("DUPLICATE_BADGE");
            error.record = existing;
            throw error;
        }
    }
    const businessCardUrl = await saveBusinessCardImage(params.businessCardBase64, params.businessCardMimeType, params.baseUrl);
    return prisma_1.prisma.record.create({
        data: {
            userId,
            qrRaw: qrRaw || [normalizedBadge || "", normalizedEvent || "", fields.Nombre || "", fields.Apellido || "", fields.Empresa || ""].join("$"),
            badgeNumber: normalizedBadge,
            eventName: normalizedEvent,
            fields,
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            businessCardUrl,
        },
        include: {
            user: { select: { id: true, name: true, email: true, role: true } },
        },
    });
}
async function listRecords(params) {
    const { requesterId, requesterRole, userId, q, badgeNumber, eventName, from, to } = params;
    const where = {};
    if (!canSeeAllRecords(requesterRole)) {
        where.userId = requesterId;
    }
    else if (userId) {
        where.userId = userId;
    }
    if (from || to) {
        where.createdAt = {};
        if (from)
            where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
        if (to)
            where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (badgeNumber?.trim())
        where.badgeNumber = badgeNumber.trim();
    if (eventName?.trim())
        where.eventName = eventName.trim();
    if (q?.trim()) {
        const query = q.trim();
        where.OR = [
            { qrRaw: { contains: query } },
            { badgeNumber: { contains: query } },
            { eventName: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
        ];
    }
    return prisma_1.prisma.record.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
        include: {
            user: { select: { id: true, name: true, email: true, role: true } },
        },
    });
}
async function updateRecord(id, userId, userRole, data, baseUrl) {
    const record = await prisma_1.prisma.record.findUnique({ where: { id } });
    if (!record)
        throw new Error("RECORD_NOT_FOUND");
    if (!canEditRecord(userRole, record.userId, userId))
        throw new Error("UNAUTHORIZED");
    const nextBadge = data.badgeNumber !== undefined ? data.badgeNumber : record.badgeNumber;
    const nextEvent = data.eventName !== undefined ? data.eventName : record.eventName;
    const nextFields = data.fields !== undefined ? data.fields : record.fields;
    validateRequiredFields(nextFields);
    if (!isValidPhone(data.phone ?? record.phone))
        throw new Error("INVALID_PHONE");
    if (!isValidEmail(data.email ?? record.email))
        throw new Error("INVALID_EMAIL");
    if (nextBadge && nextEvent) {
        const existing = await prisma_1.prisma.record.findFirst({
            where: {
                id: { not: id },
                badgeNumber: nextBadge,
                eventName: nextEvent,
            },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
            },
        });
        if (existing) {
            const error = new Error("DUPLICATE_BADGE");
            error.record = existing;
            throw error;
        }
    }
    const nextBusinessCardUrl = await saveBusinessCardImage(data.businessCardBase64, data.businessCardMimeType, baseUrl);
    return prisma_1.prisma.record.update({
        where: { id },
        data: {
            badgeNumber: data.badgeNumber !== undefined ? data.badgeNumber : record.badgeNumber,
            eventName: data.eventName !== undefined ? data.eventName : record.eventName,
            fields: nextFields,
            phone: data.phone !== undefined ? data.phone : record.phone,
            email: data.email !== undefined ? data.email : record.email,
            businessCardUrl: nextBusinessCardUrl || record.businessCardUrl,
        },
        include: {
            user: { select: { id: true, name: true, email: true, role: true } },
        },
    });
}
async function deleteRecord(id, userId, userRole) {
    const record = await prisma_1.prisma.record.findUnique({ where: { id } });
    if (!record)
        throw new Error("RECORD_NOT_FOUND");
    if (!canDeleteRecord(userRole, record.userId, userId))
        throw new Error("UNAUTHORIZED");
    await prisma_1.prisma.record.delete({ where: { id } });
}
