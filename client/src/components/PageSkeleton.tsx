import { Skeleton } from "./Skeleton";

/** Lightweight fallback for secondary public routes. */
export default function PageSkeleton() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-24" aria-busy="true" aria-label="Loading page">
      <Skeleton dark className="h-10 w-48 mb-6 rounded-lg" />
      <Skeleton dark className="h-4 w-64 max-w-full mb-8" />
      <Skeleton dark className="h-12 w-40 rounded-full" />
    </div>
  );
}
