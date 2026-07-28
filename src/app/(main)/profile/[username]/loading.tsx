const STAT_LABELS = ["Total points", "Items completed", "Items rated", "Achievements"];
const HOBBY_LABELS = ["Movies", "TV Shows", "Games", "Books"];

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="flex animate-pulse items-center gap-4 rounded-xl border border-border bg-card p-5">
        <div className="size-16 shrink-0 rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-8 w-48 max-w-full rounded bg-muted" />
          <div className="h-4 w-40 max-w-full rounded bg-muted" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_LABELS.map((label) => (
          <div key={label} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <p className="text-xs uppercase">{label}</p>
              <div className="size-4 rounded bg-muted" />
            </div>
            <div className="mt-2 h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">By hobby</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {HOBBY_LABELS.map((label) => (
            <div
              key={label}
              className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="size-10 shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 space-y-1.5">
                <p className="font-medium">{label}</p>
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Recently completed</h2>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {Array.from({ length: 5 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
            <div key={i} className="w-28 shrink-0 animate-pulse">
              <div className="aspect-2/3 rounded-lg bg-muted" />
              <div className="mt-1 h-3 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
