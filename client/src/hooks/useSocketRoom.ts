import { useEffect } from "react";
import { getSocket } from "../socket/client";

// Hook to join/leave a Socket.IO "room" for a given event.
export function useSocketRoom(eventId: string | null) {
  useEffect(() => {
    if (!eventId) return;
    const socket = getSocket();
    socket.emit("match:join", { eventId });
    return () => {
      socket.emit("match:leave", { eventId });
    };
  }, [eventId]);
}

