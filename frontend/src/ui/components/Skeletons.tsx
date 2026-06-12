/** Skeletons compartidos: perciben menos espera que un spinner centrado. */

export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stats shadow bg-base-100 w-full">
          <div className="stat space-y-2">
            <div className="h-3 w-24 bg-base-300 rounded animate-pulse" />
            <div className="h-8 w-32 bg-base-300 rounded animate-pulse" />
            <div className="h-3 w-40 bg-base-300 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="card bg-base-100 shadow-sm p-4 flex flex-row items-center gap-4"
        >
          <div className="h-10 w-10 rounded-full bg-base-300 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-base-300 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-base-300 rounded animate-pulse" />
          </div>
          <div className="h-8 w-16 bg-base-300 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
