import { NewReleasesSkeleton } from "@/components/explore/new-releases-row";

const STAT_LABELS = ["Points", "Completed", "Achievements"];

export default function ExploreLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="h-8 w-64 max-w-full rounded skeleton" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {STAT_LABELS.map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className="size-4 shrink-0 rounded skeleton" />
                <div className="h-4 w-6 rounded skeleton" />
                <p className="text-xs text-muted-foreground uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-4 w-80 max-w-full rounded skeleton" />
      </div>

      <NewReleasesSkeleton title="Now in theaters" />
      <NewReleasesSkeleton title="New episodes" />
      <NewReleasesSkeleton title="Just launched" />
    </div>
  );
}
