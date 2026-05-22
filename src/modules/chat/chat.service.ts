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

  return memberships.map((membership) => {
    const unreadCount = 0;
    return {
      ...membership.conversation,
      currentUserLastReadAt: membership.lastReadAt,
      unreadCount,
      lastMessage: membership.conversation.messages[0] || null,
    };
  });
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
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  await assertConversationMember(conversationId, senderId);
  const message = await prisma.chatMessage.create({
    data: { conversationId, senderId, body: body.trim() },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  return message;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);
  return prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
