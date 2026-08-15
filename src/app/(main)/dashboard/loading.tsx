import { NewReleasesSkeleton } from "@/components/dashboard/new-releases-row";

const STAT_LABELS = ["Total points", "Items completed", "Items rated", "Achievements"];
const HOBBY_LABELS = ["Movies", "TV Shows", "Games", "Books"];

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-64 max-w-full rounded bg-muted" />
        <div className="h-4 w-80 max-w-full rounded bg-muted" />
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Recently unlocked</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <section className="space-y-4">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">New releases</h2>
        <NewReleasesSkeleton title="Now in theaters" />
        <NewReleasesSkeleton title="New episodes" />
        <NewReleasesSkeleton title="Just launched" />
      </section>
    </div>
  );
}
