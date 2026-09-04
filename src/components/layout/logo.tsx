import Link from "next/link";

import { PixelMark } from "@/components/icons/pixel-mark";
import { cn } from "@/lib/utils";

export function Logo({
  href,
  size = "md",
  markOnly = false,
  className,
}: {
  href: string;
  size?: "sm" | "md" | "lg";
  /** Just the gem — for the collapsed sidebar. */
  markOnly?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="HOQU"
      className={cn("group/logo inline-flex items-center gap-2 outline-none", className)}
    >
      <PixelMark
        className={cn(
          "shrink-0 transition-transform duration-150 group-hover/logo:-translate-y-px group-focus-visible/logo:-translate-y-px",
          size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5",
        )}
      />
      {markOnly ? null : (
        <span
          className={cn(
            "font-pixel text-primary",
            size === "sm" ? "text-xs" : size === "lg" ? "text-base md:text-lg" : "text-sm",
          )}
        >
          HOQU
        </span>
      )}
    </Link>
  );
}
