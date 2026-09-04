import type { Metadata } from "next";

import { PublicShell } from "@/components/layout/public-shell";
import { Card } from "@/components/ui/card";

// Login/register are utility pages with no search value; keep them out of the index.
export const metadata: Metadata = {
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell>
      <div className="relative flex flex-1 items-center justify-center py-8">
        <div aria-hidden className="pixel-grid pointer-events-none absolute inset-0" />
        <Card
          padding="lg"
          className="relative w-full max-w-sm shadow-[0_0_80px_-30px_var(--primary),var(--shadow-card)]"
        >
          {children}
        </Card>
      </div>
    </PublicShell>
  );
}
