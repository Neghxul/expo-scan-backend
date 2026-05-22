import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { listChatUsers, listConversations, listMessages, markConversationRead, sendMessage, startDirectConversation } from "./chat.service";
import { sendMessageSchema, startDirectConversationSchema } from "./chat.schemas";
import { emitChatMessage } from "./chat.socket";

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
    return res.status(201).json(message);
  } catch (error: any) {
    if (error.message === "CONVERSATION_NOT_FOUND") return res.status(404).json({ message: "Conversation not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function markReadController(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const conversationId = req.params.conversationId as string;
    await markConversationRead(conversationId, user.id);
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    if (error.message === "CONVERSATION_NOT_FOUND") return res.status(404).json({ message: "Conversation not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
}
