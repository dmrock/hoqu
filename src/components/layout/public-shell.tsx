import Link from "next/link";
import { DataAttribution } from "@/components/layout/data-attribution";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 md:px-12 md:py-8">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-pixel text-base text-primary transition-opacity hover:opacity-80 md:text-lg"
        >
          HOQU
        </Link>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="flex flex-col items-center gap-2 pt-8 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>© {new Date().getFullYear()} HOQU</span>
          <span aria-hidden>·</span>
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
        <DataAttribution />
      </footer>
    </div>
  );
}
