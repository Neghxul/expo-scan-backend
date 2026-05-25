"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.startDirectConversationSchema = void 0;
const zod_1 = require("zod");
exports.startDirectConversationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
});
exports.sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().min(1),
    body: zod_1.z.string().trim().min(1).max(4000),
});
