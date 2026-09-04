import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Title row for every page. Titles are Inter, not the pixel font — Press
 * Start 2P is reserved for small accents (section labels, stat values, the
 * wordmark), where it reads as texture instead of shouting.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small pixel-font label above the title. */
  eyebrow?: React.ReactNode;
  /** Right-aligned slot for buttons, stats, counters. */
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}
      data-slot="page-header"
    >
      <div className="min-w-0 space-y-1">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="font-pixel text-[10px] text-primary uppercase leading-none">{eyebrow}</p>
        ) : null}
        <h1 className="break-words text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
