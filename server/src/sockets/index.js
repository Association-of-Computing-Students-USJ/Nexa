// Socket.IO wiring for realtime features (live matches, leaderboard, etc).
import { registerMatchSocket } from "./match.socket.js";

export function registerSockets(io) {
  io.on("connection", (socket) => {
    registerMatchSocket(io, socket);
  });
}

