"use client";

import { motion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

export type SegmentedItem<T extends string> = { value: T; label: string };

/**
 * Tab-style toggle group. The active pill slides between options via a shared
 * `layoutId`, scoped per instance so two controls on one page don't animate
 * into each other.
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  "aria-label": ariaLabel,
  pending,
  className,
}: {
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  pending?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-pending={pending || undefined}
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/40 p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative h-full shrink-0 rounded-md px-3 text-[0.8rem] whitespace-nowrap transition-colors",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`${id}-pill`}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="absolute inset-0 rounded-md bg-primary shadow-pixel-pressed"
              />
            ) : null}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
