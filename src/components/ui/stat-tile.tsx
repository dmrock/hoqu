import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  /** `inline` is the compact chip for a header row; `card` is the full tile. */
  variant?: "inline" | "card";
  /** Lands on the value element so tests can read it. */
  testId?: string;
  className?: string;
};

export function StatTile({
  label,
  value,
  icon: Icon,
  variant = "card",
  testId,
  className,
}: StatTileProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5",
          className,
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <CountUp value={value} data-testid={testId} className="font-pixel text-sm text-primary" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
    );
  }

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <IconTile size="sm">
          <Icon />
        </IconTile>
      </div>
      <CountUp value={value} data-testid={testId} className="font-pixel text-2xl text-primary" />
    </Card>
  );
}
