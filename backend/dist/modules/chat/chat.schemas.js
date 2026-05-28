"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushTokenSchema = exports.sendMessageSchema = exports.startDirectConversationSchema = void 0;
const zod_1 = require("zod");
exports.startDirectConversationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
});
exports.sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().min(1),
    body: zod_1.z.string().trim().min(1).max(4000),
});
exports.registerPushTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
    platform: zod_1.z.string().optional(),
    deviceId: zod_1.z.string().optional(),
});
