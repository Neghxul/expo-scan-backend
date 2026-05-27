import { prisma } from "../../config/prisma";

export async function listChatUsers(currentUserId: string) {
  return prisma.user.findMany({
    where: { id: { not: currentUserId }, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function listConversations(userId: string) {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    orderBy: { conversation: { updatedAt: "desc" } },
    include: {
      conversation: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return Promise.all(memberships.map(async (membership) => {
    const unreadCount = await prisma.chatMessage.count({
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

export async function startDirectConversation(currentUserId: string, otherUserId: string) {
  if (currentUserId === otherUserId) throw new Error("INVALID_CONVERSATION");

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: currentUserId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: "DIRECT",
      members: {
        create: [{ userId: currentUserId }, { userId: otherUserId }],
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
}

export async function assertConversationMember(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new Error("CONVERSATION_NOT_FOUND");
  return membership;
}

export async function listMessages(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);
  return prisma.chatMessage.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  await assertConversationMember(conversationId, senderId);
  const message = await prisma.chatMessage.create({
    data: { conversationId, senderId, body: body.trim() },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      conversation: { include: { members: { select: { userId: true } } } },
    },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return message;
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { members: { select: { userId: true } } } } },
  });

  if (!message || message.deletedAt) throw new Error("MESSAGE_NOT_FOUND");
  if (message.senderId !== userId) throw new Error("UNAUTHORIZED");

  const ageMs = Date.now() - message.createdAt.getTime();
  if (ageMs > 60 * 60 * 1000) throw new Error("DELETE_WINDOW_EXPIRED");

  return prisma.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), deletedById: userId },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      conversation: { include: { members: { select: { userId: true } } } },
    },
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);
  return prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
