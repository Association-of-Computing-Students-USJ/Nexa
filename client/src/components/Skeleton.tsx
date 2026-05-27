type SkeletonProps = {
  className?: string;
  /** Use on dark sections (committee, hero). */
  dark?: boolean;
};

export function Skeleton({ className = "", dark = false }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`skeleton-shimmer animate-pulse rounded-md ${
        dark ? "bg-[#2a2a2a]" : "bg-gray-200"
      } ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, dark = false, className = "" }: { lines?: number; dark?: boolean; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          dark={dark}
          className={`h-3 ${i === lines - 1 ? "w-4/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}
