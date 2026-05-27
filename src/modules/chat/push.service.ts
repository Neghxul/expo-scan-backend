import { prisma } from "../../config/prisma";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  channelId?: string;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_PREFIX = "ExponentPushToken[";
const EXPO_TOKEN_PREFIX_NEW = "ExpoPushToken[";

function isExpoPushToken(token: string) {
  return token.startsWith(EXPO_TOKEN_PREFIX) || token.startsWith(EXPO_TOKEN_PREFIX_NEW);
}

export async function registerPushToken(userId: string, token: string, platform?: string, deviceId?: string) {
  if (!isExpoPushToken(token)) throw new Error("INVALID_PUSH_TOKEN");

  return prisma.pushToken.upsert({
    where: { token },
    update: { userId, platform, deviceId, isActive: true },
    create: { userId, token, platform, deviceId },
  });
}

export async function sendChatPushNotification(params: {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  body: string;
  recipientIds: string[];
}) {
  const tokens = await prisma.pushToken.findMany({
    where: {
      userId: { in: params.recipientIds },
      isActive: true,
    },
    select: { token: true },
  });

  const messages: ExpoPushMessage[] = tokens
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

  if (messages.length === 0) return;

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
