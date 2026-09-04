import type { ItemStatus } from "@/lib/points";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  planned: "Planned",
  dropped: "Dropped",
};

const STATUS_CLASS: Record<ItemStatus, string> = {
  completed: "bg-primary/15 text-primary ring-primary/30",
  in_progress: "bg-accent/15 text-accent ring-accent/30",
  planned: "bg-muted text-muted-foreground ring-white/10",
  dropped: "text-muted-foreground/70 ring-white/10",
};

/** Tinted pill with a square pixel dot; `null` (show-parent rows) renders a dash. */
export function StatusBadge({
  status,
  className,
}: {
  status: ItemStatus | null;
  className?: string;
}) {
  if (status == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
        STATUS_CLASS[status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
