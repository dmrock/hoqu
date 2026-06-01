import { PublicShell } from "@/components/layout/public-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell>
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </PublicShell>
  );
}
