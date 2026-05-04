import { Link } from "react-router-dom";
import type { EventDto } from "../services/events";

// Reusable UI card for event list/grid.
export default function EventCard({ event }: { event: EventDto }) {
  const starts = new Date(event.startsAt);

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{event.title}</h3>
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-200">
          {starts.toLocaleDateString()}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-zinc-300">{event.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{event.location}</span>
        <Link to={`/events/${event.id}`} className="text-sm text-white underline-offset-4 hover:underline">
          Details
        </Link>
      </div>
    </article>
  );
}

