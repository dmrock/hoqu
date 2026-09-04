import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Types `text` out character by character behind a blinking block cursor.
 * Every character is rendered up front and revealed by a CSS delay (see
 * `.type-char` in globals.css), so the full string is in the DOM for search
 * engines and the accessible name, and nothing waits on hydration.
 */
export function Typewriter({
  text,
  startMs = 300,
  speedMs = 45,
  cursor = true,
  className,
}: {
  text: string;
  startMs?: number;
  speedMs?: number;
  cursor?: boolean;
  className?: string;
}) {
  const chars = Array.from(text);
  return (
    <span
      className={cn("whitespace-pre-wrap", className)}
      style={{ "--type-start": `${startMs}ms`, "--type-speed": `${speedMs}ms` } as CSSProperties}
    >
      {chars.map((ch, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static string, index is the identity
          key={i}
          className="type-char"
          style={{ "--i": i } as CSSProperties}
        >
          {ch}
        </span>
      ))}
      {cursor ? <span aria-hidden className="type-cursor" /> : null}
    </span>
  );
}
