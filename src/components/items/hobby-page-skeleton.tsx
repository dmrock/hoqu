// Loading-state twin of HobbyPage: same header/toolbar/table footprint so the
// real content lands without a layout jump. Shared by the four hobby routes'
// loading.tsx files.
export function HobbyPageSkeleton({ title }: { title: string }) {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pixel text-2xl">{title}</h1>
        <div className="h-9 w-20 rounded-md bg-muted" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-9 w-64 max-w-full rounded-md bg-muted" />
        <div className="h-9 w-24 rounded-md bg-muted" />
        <div className="h-9 w-24 rounded-md bg-muted" />
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <div className="h-9 bg-muted/40" />
        {Array.from({ length: 8 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="flex items-center gap-3 border-t border-border px-3 py-2">
            <div className="h-[60px] w-10 shrink-0 rounded bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-48 max-w-full rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            <div className="h-5 w-24 shrink-0 rounded-full bg-muted" />
            <div className="h-8 w-16 shrink-0 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            <div className="h-[84px] w-14 shrink-0 rounded bg-muted" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <div className="h-4 w-40 max-w-full rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
