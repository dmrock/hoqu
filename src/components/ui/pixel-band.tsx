import { cn } from "@/lib/utils";

/** Thin brand-gradient strip, chopped into pixels. Sits on top of hero cards. */
export function PixelBand({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pixel-band h-1 w-full opacity-90", className)} />;
}
