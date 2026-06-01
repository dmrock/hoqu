import Image from "next/image";
import { cn } from "@/lib/utils";

// Catalog attribution shown on every surface that renders external catalog data.
// RAWG's API terms require an active hyperlink to RAWG from every page its data
// appears on; TMDB requires its logo displayed (kept smaller than the HOQU
// wordmark) plus visible credit — the full non-endorsement notice lives on /terms.
// Keep this mounted in both the public shell and the authed layout.
function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
    >
      {children}
    </a>
  );
}

export function DataAttribution({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <Image
        src="/tmdb-logo.svg"
        alt="The Movie Database (TMDB)"
        width={30}
        height={13}
        className="opacity-70"
        unoptimized
      />
      <p>
        Catalog data from <Source href="https://www.themoviedb.org/">TMDB</Source>,{" "}
        <Source href="https://rawg.io/">RAWG</Source>, and{" "}
        <Source href="https://openlibrary.org/">Open Library</Source>.
      </p>
    </div>
  );
}
