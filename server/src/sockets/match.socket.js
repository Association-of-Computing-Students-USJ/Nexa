// Match socket handlers:
// - join match rooms
// - broadcast score updates
//
// In production: authenticate sockets and validate updates server-side.
import { prisma } from "../prisma/client.js";

export function registerMatchSocket(io, socket) {
  socket.on("match:join", ({ eventId }) => {
    socket.join(`event:${eventId}`);
  });

  socket.on("match:leave", ({ eventId }) => {
    socket.leave(`event:${eventId}`);
  });

  // Admin: update score, then broadcast to all viewers.
  socket.on("match:updateScore", async ({ matchId, scoreA, scoreB, status }) => {
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        status: status ?? undefined
      }
    });

    io.to(`event:${match.eventId}`).emit("match:scoreUpdated", { match });
  });
}

