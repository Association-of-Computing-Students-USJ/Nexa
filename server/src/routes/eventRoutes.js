// Event routes: public listing + admin create example.
import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getEventsPublic, postCreateEvent } from "../controllers/eventController.js";

export const eventRoutes = Router();

// Public website
eventRoutes.get("/", getEventsPublic);

// Admin dashboard
eventRoutes.post("/", requireAdmin, postCreateEvent);

