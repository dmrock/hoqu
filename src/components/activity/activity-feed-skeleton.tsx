export function ActivityFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
      {[0, 1, 2, 3].map((cell) => (
        <div key={cell} className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded skeleton" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <div key={i} className="min-w-0">
                <div className="aspect-2/3 rounded-lg skeleton" />
                <div className="mt-1 h-3 w-20 rounded skeleton" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
