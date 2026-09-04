import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one surface every boxed thing in HOQU sits on. Lit from the top by a
 * faint gradient plus an inset highlight, so cards read as raised rather than
 * outlined. `interactive` is for whole-card links/buttons — it brightens and
 * takes the brand border on hover; `accent` rings a card in mint for
 * "unlocked"/"success" states; `danger` for destructive sections.
 */
const cardVariants = cva(
  "rounded-xl border bg-card bg-linear-to-b from-white/[0.035] to-transparent text-card-foreground shadow-card",
  {
    variants: {
      variant: {
        default: "border-border",
        interactive:
          "border-border transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-primary/50 hover:from-white/[0.06] focus-visible:border-primary focus-visible:shadow-glow focus-visible:outline-none",
        accent: "border-accent/40 shadow-glow-accent",
        danger: "border-destructive/40 from-destructive/5",
        muted: "border-border/60 bg-card/40 from-transparent shadow-none",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-5 md:p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  },
);

function Card({
  className,
  variant,
  padding,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function CardTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h2"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h2";
  return (
    <Comp
      data-slot="card-title"
      className={cn("text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("mt-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-4 flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
