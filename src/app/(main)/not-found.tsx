import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

// Catches notFound() from authed routes — including profile privacy, where a
// hidden profile must render the exact same screen as a username that was
// never registered. Keep the copy ambiguous about which case it is.
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <p className="font-pixel text-6xl text-primary">404</p>
      <h1 className="font-pixel text-xl">Quest not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn't exist — or it's hidden from your party.
      </p>
      <Button asChild>
        <Link href="/explore">Back to Explore</Link>
      </Button>
    </div>
  );
}
