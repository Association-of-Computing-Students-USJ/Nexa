// Event controller: example endpoint for creating events.
import { z } from "zod";
import { createEvent, listPublishedEvents } from "../services/eventService.js";

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isPublished: z.boolean().optional()
});

export async function postCreateEvent(req, res, next) {
  try {
    const body = createEventSchema.parse(req.body);
    const createdById = req.user.sub;
    const event = await createEvent(body, createdById);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function getEventsPublic(req, res, next) {
  try {
    const events = await listPublishedEvents();
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

