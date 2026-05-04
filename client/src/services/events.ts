// Events API client.
import { apiFetch } from "./http";

export type EventDto = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
};

export async function listEvents() {
  return apiFetch<{ events: EventDto[] }>("/api/events");
}

