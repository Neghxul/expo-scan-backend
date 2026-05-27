"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChatUsers = listChatUsers;
exports.listConversations = listConversations;
exports.startDirectConversation = startDirectConversation;
exports.assertConversationMember = assertConversationMember;
exports.listMessages = listMessages;
exports.sendMessage = sendMessage;
exports.deleteMessage = deleteMessage;
exports.markConversationRead = markConversationRead;
const prisma_1 = require("../../config/prisma");
async function listChatUsers(currentUserId) {
    return prisma_1.prisma.user.findMany({
        where: { id: { not: currentUserId }, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
}
async function listConversations(userId) {
    const memberships = await prisma_1.prisma.conversationMember.findMany({
        where: { userId },
        orderBy: { conversation: { updatedAt: "desc" } },
        include: {
            conversation: {
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
                        },
                    },
                    messages: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        include: {
                            sender: { select: { id: true, name: true, avatarUrl: true } },
                        },
                    },
                },
            },
        },
    });
    return Promise.all(memberships.map(async (membership) => {
        const unreadCount = await prisma_1.prisma.chatMessage.count({
            where: {
                conversationId: membership.conversationId,
                senderId: { not: userId },
                deletedAt: null,
                ...(membership.lastReadAt ? { createdAt: { gt: membership.lastReadAt } } : {}),
            },
        });
        return {
            ...membership.conversation,
            currentUserLastReadAt: membership.lastReadAt,
            unreadCount,
            lastMessage: membership.conversation.messages[0] || null,
        };
    }));
}
async function startDirectConversation(currentUserId, otherUserId) {
    if (currentUserId === otherUserId)
        throw new Error("INVALID_CONVERSATION");
    const existing = await prisma_1.prisma.conversation.findFirst({
        where: {
            type: "DIRECT",
            AND: [
                { members: { some: { userId: currentUserId } } },
                { members: { some: { userId: otherUserId } } },
            ],
        },
        include: {
            members: { include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } } },
        },
    });
    if (existing)
        return existing;
    return prisma_1.prisma.conversation.create({
        data: {
            type: "DIRECT",
            members: {
                create: [{ userId: currentUserId }, { userId: otherUserId }],
            },
        },
        include: {
            members: { include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } } },
        },
    });
}
async function assertConversationMember(conversationId, userId) {
    const membership = await prisma_1.prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership)
        throw new Error("CONVERSATION_NOT_FOUND");
    return membership;
}
async function listMessages(conversationId, userId) {
    await assertConversationMember(conversationId, userId);
    return prisma_1.prisma.chatMessage.findMany({
        where: { conversationId, deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { sender: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
    });
}
async function sendMessage(conversationId, senderId, body) {
    await assertConversationMember(conversationId, senderId);
    const message = await prisma_1.prisma.chatMessage.create({
        data: { conversationId, senderId, body: body.trim() },
        include: {
            sender: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
            conversation: { include: { members: { select: { userId: true } } } },
        },
    });
    await prisma_1.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
}
async function deleteMessage(messageId, userId) {
    const message = await prisma_1.prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: { conversation: { include: { members: { select: { userId: true } } } } },
    });
    if (!message || message.deletedAt)
        throw new Error("MESSAGE_NOT_FOUND");
    if (message.senderId !== userId)
        throw new Error("UNAUTHORIZED");
    const ageMs = Date.now() - message.createdAt.getTime();
    if (ageMs > 60 * 60 * 1000)
        throw new Error("DELETE_WINDOW_EXPIRED");
    return prisma_1.prisma.chatMessage.update({
        where: { id: messageId },
        data: { deletedAt: new Date(), deletedById: userId },
        include: {
            sender: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
            conversation: { include: { members: { select: { userId: true } } } },
        },
    });
}
async function markConversationRead(conversationId, userId) {
    await assertConversationMember(conversationId, userId);
    return prisma_1.prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: new Date() },
    });
}
