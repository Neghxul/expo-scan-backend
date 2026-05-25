"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChatUsersController = listChatUsersController;
exports.listConversationsController = listConversationsController;
exports.startDirectConversationController = startDirectConversationController;
exports.listMessagesController = listMessagesController;
exports.sendMessageController = sendMessageController;
exports.markReadController = markReadController;
const chat_service_1 = require("./chat.service");
const chat_schemas_1 = require("./chat.schemas");
const chat_socket_1 = require("./chat.socket");
async function listChatUsersController(req, res) {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: "Unauthorized" });
    const users = await (0, chat_service_1.listChatUsers)(user.id);
    return res.status(200).json(users);
}
async function listConversationsController(req, res) {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: "Unauthorized" });
    const conversations = await (0, chat_service_1.listConversations)(user.id);
    return res.status(200).json(conversations);
}
async function startDirectConversationController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = chat_schemas_1.startDirectConversationSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const conversation = await (0, chat_service_1.startDirectConversation)(user.id, parsed.data.userId);
        return res.status(200).json(conversation);
    }
    catch (error) {
        if (error.message === "INVALID_CONVERSATION")
            return res.status(400).json({ message: "Invalid conversation" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function listMessagesController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        const messages = await (0, chat_service_1.listMessages)(conversationId, user.id);
        return res.status(200).json(messages);
    }
    catch (error) {
        if (error.message === "CONVERSATION_NOT_FOUND")
            return res.status(404).json({ message: "Conversation not found" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function sendMessageController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const parsed = chat_schemas_1.sendMessageSchema.safeParse({ ...req.body, conversationId: req.params.conversationId });
        if (!parsed.success)
            return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
        const message = await (0, chat_service_1.sendMessage)(parsed.data.conversationId, user.id, parsed.data.body);
        (0, chat_socket_1.emitChatMessage)(parsed.data.conversationId, message);
        return res.status(201).json(message);
    }
    catch (error) {
        if (error.message === "CONVERSATION_NOT_FOUND")
            return res.status(404).json({ message: "Conversation not found" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function markReadController(req, res) {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const conversationId = req.params.conversationId;
        const readState = await (0, chat_service_1.markConversationRead)(conversationId, user.id);
        (0, chat_socket_1.emitChatRead)(conversationId, user.id, readState.lastReadAt || new Date());
        return res.status(200).json({ ok: true });
    }
    catch (error) {
        if (error.message === "CONVERSATION_NOT_FOUND")
            return res.status(404).json({ message: "Conversation not found" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
