import { Skeleton } from "./Skeleton";

/** Minimal placeholder while lazy-loaded homepage sections hydrate. */
export default function SectionFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" aria-hidden>
      <Skeleton className="h-8 w-48 mx-auto mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
