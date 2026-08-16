"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Segmented progress bar in the pixel-accent style: square corners, and notches
 * punched over the fill by a repeating gradient rather than by per-segment DOM,
 * so a page rendering dozens of these stays cheap.
 */
export function PixelProgress({
  value,
  target,
  className,
}: {
  value: number;
  target: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={target}
      className={cn("relative h-2 w-full overflow-hidden bg-muted", className)}
    >
      <motion.div
        className="h-full bg-primary"
        initial={reduced ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {/* Notches sit above the fill so the segments read at any width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, transparent 0 6px, var(--card) 6px 8px)",
        }}
      />
    </div>
  );
}
