import { notFound } from "next/navigation";

// Unmatched URLs belong to no route group, so they'd render the root
// not-found outside the sidebar layout. This catch-all claims every path no
// real route matched and rethrows it into the (main) not-found boundary.
// Signed-out visitors never render this page: for most paths proxy.ts
// redirects to /login before Next routing even runs; for /login/* and
// /register/* (which proxy intentionally lets through) it's (main)/layout.tsx's
// own session redirect that fires first instead, since that layout wraps
// every page in this route group, including this one.
export default function MissingPage() {
  notFound();
}
