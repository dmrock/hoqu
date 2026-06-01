import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col px-4 py-12">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">{children}</div>
      </div>
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
