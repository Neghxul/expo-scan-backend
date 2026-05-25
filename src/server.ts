import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
// import { env } from "./config/env"; // Puedes dejar tu env para otras variables
import { initChatSocket } from "./modules/chat/chat.socket";

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initChatSocket(io);

// 🔥 CAMBIO CRÍTICO PARA HOSTINGER:
const PORT = process.env.PORT || 3001; 

httpServer.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});