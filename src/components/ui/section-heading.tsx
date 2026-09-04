import { PixelBits } from "@/components/icons/pixel-bits";
import { cn } from "@/lib/utils";

/**
 * Pixel-font label for a page section, with an optional right-aligned action
 * (a toggle, a "View all" link). Card-level titles use `CardTitle` instead.
 */
export function SectionHeading({
  children,
  action,
  as = "h2",
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
  tone?: "muted" | "accent";
  className?: string;
}) {
  const Tag = as;
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", className)}>
      <Tag
        className={cn(
          "flex items-center gap-2 font-pixel text-xs uppercase leading-none",
          tone === "accent" ? "text-accent" : "text-muted-foreground",
        )}
      >
        <PixelBits className="size-2.5 shrink-0" />
        <span>{children}</span>
      </Tag>
      {action}
    </div>
  );
}
