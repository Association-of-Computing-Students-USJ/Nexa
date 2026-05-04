// App entrypoint: Express API + Socket.IO realtime server.
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";

import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { eventRoutes } from "./routes/eventRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerSockets } from "./sockets/index.js";

const app = express();
app.disable("x-powered-by");

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.use(errorHandler);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: env.clientOrigin }
});
registerSockets(io);

server.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.port}`);
});

