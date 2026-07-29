"use client";

import { RouteError, type RouteErrorProps } from "@/components/layout/route-error";

// Group error boundaries sit inside their layouts, so they can't catch the
// layouts themselves failing — and (main)'s layout runs DB queries on every
// request. This root boundary catches those while the root layout's fonts and
// theme are still up; global-error remains the unstyled last resort.
export default function RootError({ error, reset }: RouteErrorProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <RouteError error={error} reset={reset} />
    </div>
  );
}
