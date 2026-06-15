import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";

// Login/register are utility pages with no search value; keep them out of the index.
export const metadata: Metadata = {
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell>
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </PublicShell>
  );
}
