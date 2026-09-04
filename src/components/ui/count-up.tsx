import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Number that counts up from 0 on first paint. Pure CSS (see `.count-up-visual`
 * in globals.css): the final value lives in a visually-hidden span so screen
 * readers and `innerText` always see the real number, while the digits on
 * screen are a CSS counter animated through a registered property. No JS, no
 * hydration flash, and reduced-motion just shows the final value.
 */
export function CountUp({
  value,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { value: number }) {
  return (
    <span
      className={cn("inline-block tabular-nums", className)}
      style={{ "--count-target": String(value) } as CSSProperties}
      {...props}
    >
      <span className="sr-only">{value}</span>
      <span aria-hidden className="count-up-visual" />
    </span>
  );
}
