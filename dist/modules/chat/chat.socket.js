"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChatSocket = initChatSocket;
exports.emitChatMessage = emitChatMessage;
exports.emitChatRead = emitChatRead;
exports.emitChatMessageDeleted = emitChatMessageDeleted;
const jwt_1 = require("../../utils/jwt");
const chat_service_1 = require("./chat.service");
const push_service_1 = require("./push.service");
let ioRef = null;
function initChatSocket(io) {
    ioRef = io;
    io.use((socket, next) => {
        try {
            const token = String(socket.handshake.auth?.token || "").trim();
            if (!token)
                return next(new Error("Unauthorized"));
            const payload = (0, jwt_1.verifyAccessToken)(token);
            socket.userId = payload.sub;
            socket.join(`user:${payload.sub}`);
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        socket.on("conversation:join", async (conversationId, ack) => {
            try {
                if (!socket.userId)
                    throw new Error("Unauthorized");
                await (0, chat_service_1.assertConversationMember)(conversationId, socket.userId);
                socket.join(`conversation:${conversationId}`);
                ack?.({ ok: true });
            }
            catch {
                ack?.({ ok: false, message: "Conversation not found" });
            }
        });
        socket.on("message:send", async (payload, ack) => {
            try {
                if (!socket.userId)
                    throw new Error("Unauthorized");
                const message = await (0, chat_service_1.sendMessage)(payload.conversationId, socket.userId, payload.body);
                emitChatMessage(payload.conversationId, message);
                const recipientIds = message.conversation.members.map((member) => member.userId).filter((userId) => userId !== socket.userId);
                (0, push_service_1.sendChatPushNotification)({
                    conversationId: payload.conversationId,
                    messageId: message.id,
                    senderId: socket.userId,
                    senderName: message.sender?.name || "Usuario",
                    body: message.body,
                    recipientIds,
                }).catch((error) => console.error("Push send error", error));
                ack?.({ ok: true, message });
            }
            catch {
                ack?.({ ok: false });
            }
        });
    });
}
function emitChatMessage(conversationId, message) {
    if (!ioRef)
        return;
    const recipients = message?.conversation?.members || [];
    recipients.forEach((member) => {
        ioRef?.to(`user:${member.userId}`).emit("message:new", message);
    });
}
function emitChatRead(conversationId, userId, readAt) {
    ioRef?.to(`conversation:${conversationId}`).emit("conversation:read", {
        conversationId,
        userId,
        readAt: readAt.toISOString(),
    });
}
function emitChatMessageDeleted(conversationId, message) {
    if (!ioRef)
        return;
    const recipients = message?.conversation?.members || [];
    recipients.forEach((member) => {
        ioRef?.to(`user:${member.userId}`).emit("message:deleted", message);
    });
}
