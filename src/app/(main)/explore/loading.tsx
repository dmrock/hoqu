import { NewReleasesSkeleton } from "@/components/explore/new-releases-row";
import { SectionHeading } from "@/components/ui/section-heading";

const STAT_LABELS = ["Points", "Completed", "Achievements"];

export default function ExploreLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="space-y-2">
          <div className="h-8 w-64 max-w-full rounded skeleton md:h-9" />
          <div className="h-4 w-80 max-w-full rounded skeleton" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STAT_LABELS.map((label) => (
            <div
              key={label}
              className="flex h-8 items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-2.5"
            >
              <div className="size-4 shrink-0 rounded skeleton" />
              <div className="h-3.5 w-8 rounded skeleton" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeading>New releases</SectionHeading>
        <NewReleasesSkeleton title="Now in theaters" />
        <NewReleasesSkeleton title="New episodes" />
        <NewReleasesSkeleton title="Just launched" />
      </section>
    </div>
  );
}
