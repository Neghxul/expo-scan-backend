import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../../utils/jwt";
import { assertConversationMember, sendMessage } from "./chat.service";
import { sendChatPushNotification } from "./push.service";

let ioRef: Server | null = null;

type AuthedSocket = Socket & { userId?: string };

export function initChatSocket(io: Server) {
  ioRef = io;

  io.use((socket: AuthedSocket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || "").trim();
      if (!token) return next(new Error("Unauthorized"));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.join(`user:${payload.sub}`);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    socket.on("conversation:join", async (conversationId: string, ack?: (response: { ok: boolean; message?: string }) => void) => {
      try {
        if (!socket.userId) throw new Error("Unauthorized");
        await assertConversationMember(conversationId, socket.userId);
        socket.join(`conversation:${conversationId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, message: "Conversation not found" });
      }
    });

    socket.on("message:send", async (payload: { conversationId: string; body: string }, ack?: (response: { ok: boolean; message?: unknown }) => void) => {
      try {
        if (!socket.userId) throw new Error("Unauthorized");
        const message = await sendMessage(payload.conversationId, socket.userId, payload.body);
        emitChatMessage(payload.conversationId, message);
        const recipientIds = message.conversation.members.map((member) => member.userId).filter((userId) => userId !== socket.userId);
        sendChatPushNotification({
          conversationId: payload.conversationId,
          messageId: message.id,
          senderId: socket.userId,
          senderName: message.sender?.name || "Usuario",
          body: message.body,
          recipientIds,
        }).catch((error) => console.error("Push send error", error));
        ack?.({ ok: true, message });
      } catch {
        ack?.({ ok: false });
      }
    });
  });
}

export function emitChatMessage(conversationId: string, message: unknown) {
  if (!ioRef) return;
  const recipients = (message as { conversation?: { members?: { userId: string }[] } })?.conversation?.members || [];
  recipients.forEach((member) => {
    ioRef?.to(`user:${member.userId}`).emit("message:new", message);
  });
}

export function emitChatRead(conversationId: string, userId: string, readAt: Date) {
  ioRef?.to(`conversation:${conversationId}`).emit("conversation:read", {
    conversationId,
    userId,
    readAt: readAt.toISOString(),
  });
}

export function emitChatMessageDeleted(conversationId: string, message: unknown) {
  if (!ioRef) return;
  const recipients = (message as { conversation?: { members?: { userId: string }[] } })?.conversation?.members || [];
  recipients.forEach((member) => {
    ioRef?.to(`user:${member.userId}`).emit("message:deleted", message);
  });
}
