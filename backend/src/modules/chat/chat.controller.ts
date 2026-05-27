import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { deleteMessage, listChatUsers, listConversations, listMessages, markConversationRead, sendMessage, startDirectConversation } from "./chat.service";
import { registerPushTokenSchema, sendMessageSchema, startDirectConversationSchema } from "./chat.schemas";
import { emitChatMessage, emitChatMessageDeleted, emitChatRead } from "./chat.socket";
import { registerPushToken, sendChatPushNotification } from "./push.service";

export async function listChatUsersController(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const users = await listChatUsers(user.id);
  return res.status(200).json(users);
}

export async function listConversationsController(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const conversations = await listConversations(user.id);
  return res.status(200).json(conversations);
}

export async function startDirectConversationController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const parsed = startDirectConversationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    const conversation = await startDirectConversation(user.id, parsed.data.userId);
    return res.status(200).json(conversation);
  } catch (error: any) {
    if (error.message === "INVALID_CONVERSATION") return res.status(400).json({ message: "Invalid conversation" });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listMessagesController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const conversationId = req.params.conversationId as string;
    const messages = await listMessages(conversationId, user.id);
    return res.status(200).json(messages);
  } catch (error: any) {
    if (error.message === "CONVERSATION_NOT_FOUND") return res.status(404).json({ message: "Conversation not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendMessageController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const parsed = sendMessageSchema.safeParse({ ...req.body, conversationId: req.params.conversationId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    const message = await sendMessage(parsed.data.conversationId, user.id, parsed.data.body);
    emitChatMessage(parsed.data.conversationId, message);
    const recipientIds = message.conversation.members.map((member) => member.userId).filter((userId) => userId !== user.id);
    sendChatPushNotification({
      conversationId: parsed.data.conversationId,
      messageId: message.id,
      senderId: user.id,
      senderName: user.name,
      body: message.body,
      recipientIds,
    }).catch((error) => console.error("Push send error", error));
    return res.status(201).json(message);
  } catch (error: any) {
    if (error.message === "CONVERSATION_NOT_FOUND") return res.status(404).json({ message: "Conversation not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function registerPushTokenController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const parsed = registerPushTokenSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    await registerPushToken(user.id, parsed.data.token, parsed.data.platform, parsed.data.deviceId);
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    if (error.message === "INVALID_PUSH_TOKEN") return res.status(400).json({ message: "Invalid push token" });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteMessageController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const message = await deleteMessage(req.params.messageId as string, user.id);
    emitChatMessageDeleted(message.conversationId, message);
    return res.status(200).json(message);
  } catch (error: any) {
    if (error.message === "MESSAGE_NOT_FOUND") return res.status(404).json({ message: "Message not found" });
    if (error.message === "UNAUTHORIZED") return res.status(403).json({ message: "Unauthorized" });
    if (error.message === "DELETE_WINDOW_EXPIRED") return res.status(400).json({ message: "Solo puedes eliminar mensajes recientes." });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function markReadController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const conversationId = req.params.conversationId as string;
    const readState = await markConversationRead(conversationId, user.id);
    emitChatRead(conversationId, user.id, readState.lastReadAt || new Date());
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    if (error.message === "CONVERSATION_NOT_FOUND") return res.status(404).json({ message: "Conversation not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
}
