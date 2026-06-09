export function ActivityFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
      {[0, 1, 2, 3].map((cell) => (
        <div key={cell} className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="-m-1 flex gap-3 overflow-x-auto p-1 pb-2">
            {Array.from({ length: 3 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <div key={i} className="w-28 shrink-0 animate-pulse">
                <div className="aspect-2/3 rounded-lg bg-muted" />
                <div className="mt-1 h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
