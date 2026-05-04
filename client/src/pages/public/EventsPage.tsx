import { useEffect, useState } from "react";
import { listEvents, type EventDto } from "../../services/events";
import EventCard from "../../components/EventCard";

// Public page: events listing (cards).
export default function EventsPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listEvents();
        if (mounted) setEvents(res.events);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load events");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="mt-2 text-zinc-300">Explore upcoming tech events and live games.</p>
      </div>

      {loading ? (
        <div className="text-zinc-300">Loading…</div>
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}

