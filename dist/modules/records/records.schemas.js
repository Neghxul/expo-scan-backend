"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRecordSchema = exports.listRecordsQuerySchema = exports.createRecordSchema = void 0;
const zod_1 = require("zod");
exports.createRecordSchema = zod_1.z.object({
    qrRaw: zod_1.z.string().min(1),
    badgeNumber: zod_1.z.string().optional().nullable(),
    eventName: zod_1.z.string().optional().nullable(),
    fields: zod_1.z.record(zod_1.z.string()),
    phone: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().optional().nullable(),
    isManual: zod_1.z.boolean().optional(),
    businessCardBase64: zod_1.z.string().optional().nullable(),
    businessCardMimeType: zod_1.z.string().optional().nullable(),
});
exports.listRecordsQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    q: zod_1.z.string().optional(),
    badgeNumber: zod_1.z.string().optional(),
    eventName: zod_1.z.string().optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
});
exports.updateRecordSchema = zod_1.z.object({
    badgeNumber: zod_1.z.string().nullable().optional(),
    eventName: zod_1.z.string().nullable().optional(),
    fields: zod_1.z.record(zod_1.z.string()).optional(),
    phone: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().nullable().optional(),
    businessCardBase64: zod_1.z.string().nullable().optional(),
    businessCardMimeType: zod_1.z.string().nullable().optional(),
});
