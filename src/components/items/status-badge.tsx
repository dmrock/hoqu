import type { SVGProps } from "react";

import type { ItemStatus } from "@/lib/points";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  planned: "Planned",
  dropped: "Dropped",
};

const STATUS_CLASS: Record<ItemStatus, string> = {
  completed: "bg-accent/15 text-accent ring-accent/30",
  in_progress: "bg-primary/15 text-primary ring-primary/30",
  planned: "bg-muted text-muted-foreground ring-white/10",
  dropped: "bg-destructive/10 text-destructive/80 ring-destructive/25",
};

// 5×5 pixel glyphs, one per status: ✓ / ▸ / hollow square / ✕.
const STATUS_GLYPH: Record<ItemStatus, string> = {
  completed: "M4 0h1v1H4zM3 1h2v1H3zM0 2h1v1H0zM2 2h2v1H2zM0 3h3v1H0zM1 4h1v1H1z",
  in_progress: "M1 0h2v1H1zM1 1h3v1H1zM1 2h4v1H1zM1 3h3v1H1zM1 4h2v1H1z",
  planned: "M0 0h5v1H0zM0 4h5v1H0zM0 1h1v3H0zM4 1h1v3H4z",
  dropped: "M0 0h2v1H0zM3 0h2v1H3zM1 1h3v1H1zM2 2h1v1H2zM1 3h3v1H1zM0 4h2v1H0zM3 4h2v1H3z",
};

function StatusGlyph({ status, ...props }: { status: ItemStatus } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 5 5"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={STATUS_GLYPH[status]} fill="currentColor" />
    </svg>
  );
}

/** Tinted pill with a per-status pixel glyph; `null` (show-parent rows) renders a dash. */
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
      <StatusGlyph status={status} className="size-2.5" />
      {STATUS_LABEL[status]}
    </span>
  );
}
