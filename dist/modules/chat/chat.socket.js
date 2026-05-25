"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChatSocket = initChatSocket;
exports.emitChatMessage = emitChatMessage;
const jwt_1 = require("../../utils/jwt");
const chat_service_1 = require("./chat.service");
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
    ioRef.to(`conversation:${conversationId}`).emit("message:new", message);
    const recipients = message?.conversation?.members || [];
    recipients.forEach((member) => {
        ioRef?.to(`user:${member.userId}`).emit("message:new", message);
    });
}
