import { NewReleasesSkeleton } from "@/components/dashboard/new-releases-row";

const STAT_LABELS = ["Points", "Completed", "Achievements"];
const HOBBY_LABELS = ["Movies", "TV Shows", "Games", "Books"];

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="h-8 w-64 max-w-full animate-pulse rounded bg-muted" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {STAT_LABELS.map((label) => (
              <div key={label} className="flex animate-pulse items-center gap-2">
                <div className="size-4 shrink-0 rounded bg-muted" />
                <div className="h-4 w-6 rounded bg-muted" />
                <p className="text-xs text-muted-foreground uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="space-y-3 xl:col-span-2">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Quest log</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            {HOBBY_LABELS.map((label) => (
              <div
                key={label}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-card p-3"
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

        <section className="space-y-3 xl:col-span-3">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Latest unlocks</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3">
            {[0, 1, 2, 3, 4].map((card) => (
              <div
                key={card}
                className="flex animate-pulse items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="size-10 shrink-0 rounded-lg bg-muted" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <div className="h-4 w-28 max-w-full rounded bg-muted" />
                  <div className="h-3 w-36 max-w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">New releases</h2>
        <NewReleasesSkeleton title="Now in theaters" />
        <NewReleasesSkeleton title="New episodes" />
        <NewReleasesSkeleton title="Just launched" />
      </section>
    </div>
  );
}
