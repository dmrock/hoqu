"use client";

import { useEffect } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { GITHUB_NEW_BUG_URL } from "@/lib/site";

export type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    // The server log has the full error; the client only ever sees the
    // digest, so nothing sensitive reaches the UI or the browser console.
    console.error(`Route error digest: ${error.digest ?? "n/a"}`);
  }, [error]);

  return (
    <div className="relative flex flex-col items-center gap-6 py-24 text-center">
      <div aria-hidden className="pixel-grid pointer-events-none absolute inset-0" />
      <p className="relative font-pixel text-6xl text-destructive drop-shadow-[0_0_28px_var(--destructive)]">
        x_x
      </p>
      <h1 className="relative text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="relative max-w-sm text-sm text-muted-foreground">
        An unexpected error interrupted your quest. It's usually temporary — try again.
      </p>
      {error.digest ? (
        <p className="relative font-mono text-xs text-muted-foreground">
          error code: {error.digest}
        </p>
      ) : null}
      <div className="relative flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        {/* The digest is the only handle on this failure, and it's gone the
            moment the user navigates away — so hand it straight to the bug
            form via the `digest` field id rather than asking them to copy it. */}
        <Button variant="outline" asChild>
          <a
            href={`${GITHUB_NEW_BUG_URL}&digest=${encodeURIComponent(error.digest ?? "")}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            <GithubIcon className="size-4" />
            Report it
          </a>
        </Button>
      </div>
    </div>
  );
}
