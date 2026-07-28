import { notFound } from "next/navigation";

// Unmatched URLs belong to no route group, so they'd render the root
// not-found outside the sidebar layout. This catch-all claims every path no
// real route matched and rethrows it into the (main) not-found boundary.
// Signed-out visitors never get here — proxy.ts bounces them to /login first.
export default function MissingPage() {
  notFound();
}
