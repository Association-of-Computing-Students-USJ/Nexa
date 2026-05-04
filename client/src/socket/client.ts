// Socket.IO client singleton.
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    transports: ["websocket"]
  });
  return socket;
}

