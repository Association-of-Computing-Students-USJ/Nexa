import { Skeleton } from "./Skeleton";

export default function HomePageSkeleton() {
  return (
    <div className="min-h-dvh bg-white" aria-busy="true" aria-label="Loading page">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <Skeleton className="md:hidden h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Hero */}
      <div className="relative min-h-screen pt-24">
        <Skeleton dark className="absolute inset-0 rounded-none" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 gap-6">
          <Skeleton dark className="h-12 sm:h-16 w-4/5 max-w-lg" />
          <Skeleton dark className="h-12 sm:h-16 w-3/5 max-w-md" />
          <Skeleton dark className="h-4 w-64 max-w-full" />
          <div className="flex gap-3 mt-4 w-full max-w-xs sm:max-w-none justify-center">
            <Skeleton dark className="h-12 flex-1 sm:w-36 rounded-full" />
            <Skeleton dark className="h-12 flex-1 sm:w-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Section blocks */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        <div className="text-center space-y-4">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-10 w-2/3 max-w-md mx-auto" />
          <Skeleton className="h-4 w-full max-w-xl mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl overflow-hidden border border-gray-100">
              <Skeleton className="aspect-[4/5] w-full rounded-none" />
              <div className="p-5 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid min-[480px]:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} dark className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
