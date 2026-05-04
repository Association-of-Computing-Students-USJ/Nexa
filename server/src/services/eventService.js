// Event service: contains business logic for Event CRUD.
import { prisma } from "../prisma/client.js";

export async function createEvent(data, createdById) {
  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      isPublished: data.isPublished ?? true,
      createdById
    }
  });
}

export async function listPublishedEvents() {
  return prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { startsAt: "asc" }
  });
}

