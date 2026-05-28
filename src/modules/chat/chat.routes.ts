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
import { requireChatEnabled } from "./chat.enabled.middleware";

const router = Router();

router.use(requireAuth, requireChatEnabled);
router.get("/users", listChatUsersController);
router.post("/push-token", registerPushTokenController);
router.get("/conversations", listConversationsController);
router.post("/conversations/direct", startDirectConversationController);
router.get("/conversations/:conversationId/messages", listMessagesController);
router.post("/conversations/:conversationId/messages", sendMessageController);
router.post("/conversations/:conversationId/read", markReadController);
router.delete("/messages/:messageId", deleteMessageController);

export default router;
