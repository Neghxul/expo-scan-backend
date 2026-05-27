"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushToken = registerPushToken;
exports.sendChatPushNotification = sendChatPushNotification;
const prisma_1 = require("../../config/prisma");
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_PREFIX = "ExponentPushToken[";
const EXPO_TOKEN_PREFIX_NEW = "ExpoPushToken[";
function isExpoPushToken(token) {
    return token.startsWith(EXPO_TOKEN_PREFIX) || token.startsWith(EXPO_TOKEN_PREFIX_NEW);
}
async function registerPushToken(userId, token, platform, deviceId) {
    if (!isExpoPushToken(token))
        throw new Error("INVALID_PUSH_TOKEN");
    return prisma_1.prisma.pushToken.upsert({
        where: { token },
        update: { userId, platform, deviceId, isActive: true },
        create: { userId, token, platform, deviceId },
    });
}
async function sendChatPushNotification(params) {
    const tokens = await prisma_1.prisma.pushToken.findMany({
        where: {
            userId: { in: params.recipientIds },
            isActive: true,
        },
        select: { token: true },
    });
    const messages = tokens
        .filter((item) => isExpoPushToken(item.token))
        .map((item) => ({
        to: item.token,
        title: params.senderName ? `Nuevo mensaje de ${params.senderName}` : "Nuevo mensaje",
        body: params.body,
        sound: "default",
        priority: "high",
        channelId: "chat_messages_v2",
        data: {
            type: "chat",
            conversationId: params.conversationId,
            messageId: params.messageId,
            senderId: params.senderId,
        },
    }));
    if (messages.length === 0)
        return;
    for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(chunk),
        }).catch((error) => {
            console.error("Expo push error", error);
        });
    }
}
