"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server log has the full error; the client only ever sees the
    // digest, so nothing sensitive reaches the UI or the browser console.
    console.error(`Route error digest: ${error.digest ?? "n/a"}`);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <p className="font-pixel text-6xl text-destructive">x_x</p>
      <h1 className="font-pixel text-xl">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error interrupted your quest. It's usually temporary — try again.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">error code: {error.digest}</p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
