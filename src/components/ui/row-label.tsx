import { cn } from "@/lib/utils";

/** Mono sub-label with an accent tick, for rows nested under a SectionHeading. */
export function RowLabel({
  children,
  as = "h3",
  className,
}: {
  children: React.ReactNode;
  as?: "h3" | "h4" | "p";
  className?: string;
}) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "flex items-center gap-2 font-mono text-xs text-foreground uppercase tracking-wider",
        className,
      )}
    >
      <span aria-hidden className="h-3 w-0.5 shrink-0 bg-accent" />
      {children}
    </Tag>
  );
}
