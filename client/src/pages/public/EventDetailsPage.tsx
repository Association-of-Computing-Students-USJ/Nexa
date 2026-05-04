import { useParams } from "react-router-dom";

// Public page: event details (stub template).
export default function EventDetailsPage() {
  const { id } = useParams();
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Event Details</h1>
      <p className="text-zinc-300">Event id: {id}</p>
      <p className="text-sm text-zinc-400">
        Hook this page to `/api/events/:id` and include matches + registration CTA.
      </p>
    </section>
  );
}

