import type { Metadata } from "next";
import Link from "next/link";

import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

// Global fallback for unmatched URLs outside the authed shell. The (main)
// catch-all claims signed-in traffic, so this mostly serves signed-out edge
// cases and notFound() thrown from public pages.
export default function NotFound() {
  return (
    <PublicShell>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <div aria-hidden className="pixel-grid pointer-events-none absolute inset-0" />
        <p className="relative font-pixel text-6xl text-primary drop-shadow-[0_0_28px_var(--primary)]">
          404
        </p>
        <h1 className="relative text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="relative max-w-sm text-sm text-muted-foreground">
          This page doesn't exist. Maybe the quest moved, maybe it never was.
        </p>
        <div className="relative flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
