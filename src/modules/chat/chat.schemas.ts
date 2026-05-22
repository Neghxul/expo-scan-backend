import { z } from "zod";

export const startDirectConversationSchema = z.object({
  userId: z.string().min(1),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});
