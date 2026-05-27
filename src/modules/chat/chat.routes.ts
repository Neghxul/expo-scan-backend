import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  deleteMessageController,
  listChatUsersController,
  listConversationsController,
  listMessagesController,
  markReadController,
  registerPushTokenController,
  sendMessageController,
  startDirectConversationController,
} from "./chat.controller";

const router = Router();

router.get("/users", requireAuth, listChatUsersController);
router.post("/push-token", requireAuth, registerPushTokenController);
router.get("/conversations", requireAuth, listConversationsController);
router.post("/conversations/direct", requireAuth, startDirectConversationController);
router.get("/conversations/:conversationId/messages", requireAuth, listMessagesController);
router.post("/conversations/:conversationId/messages", requireAuth, sendMessageController);
router.post("/conversations/:conversationId/read", requireAuth, markReadController);
router.delete("/messages/:messageId", requireAuth, deleteMessageController);

export default router;
