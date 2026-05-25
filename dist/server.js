"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
// import { env } from "./config/env"; // Puedes dejar tu env para otras variables
const chat_socket_1 = require("./modules/chat/chat.socket");
const httpServer = http_1.default.createServer(app_1.app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
(0, chat_socket_1.initChatSocket)(io);
// 🔥 CAMBIO CRÍTICO PARA HOSTINGER:
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
