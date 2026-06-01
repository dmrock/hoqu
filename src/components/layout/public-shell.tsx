import Link from "next/link";

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

      <footer className="flex flex-wrap items-center justify-center gap-3 pt-8 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} HOQU</span>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="transition-colors hover:text-foreground">
          Terms
        </Link>
      </footer>
    </div>
  );
}
