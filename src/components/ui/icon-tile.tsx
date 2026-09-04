import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Square tile behind a lucide icon. `tone` tints both the icon and its
 * background so a grid of tiles reads as a set; `solid-accent` is the
 * "unlocked" treatment on achievements and toasts.
 */
const iconTileVariants = cva(
  "flex shrink-0 items-center justify-center rounded-lg ring-1 ring-inset [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        muted: "bg-muted text-muted-foreground ring-white/5",
        foreground: "bg-muted text-foreground ring-white/10",
        primary: "bg-primary/15 text-primary ring-primary/25",
        accent: "bg-accent/15 text-accent ring-accent/25",
        warning: "bg-warning/15 text-warning ring-warning/25",
        destructive: "bg-destructive/15 text-destructive ring-destructive/25",
        "solid-accent":
          "bg-accent text-accent-foreground ring-accent/40 shadow-[0_0_18px_-4px_var(--accent)]",
      },
      size: {
        sm: "size-8 [&_svg]:size-4",
        md: "size-10 [&_svg]:size-5",
        lg: "size-12 [&_svg]:size-6",
        xl: "size-14 [&_svg]:size-7",
      },
    },
    defaultVariants: { tone: "muted", size: "md" },
  },
);

export function IconTile({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof iconTileVariants>) {
  return (
    <div
      data-slot="icon-tile"
      className={cn(iconTileVariants({ tone, size }), className)}
      {...props}
    />
  );
}
