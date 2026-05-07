"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { type LeaderboardScope, SCOPE_OPTIONS } from "@/lib/leaderboards";
import { cn } from "@/lib/utils";

export function LeaderboardScopeTabs({ active }: { active: LeaderboardScope }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function selectScope(value: LeaderboardScope) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("scope");
    else params.set("scope", value);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Leaderboard scope"
      className="inline-flex h-7 items-center overflow-hidden rounded-md border border-border bg-muted/40"
      data-pending={pending || undefined}
    >
      {SCOPE_OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => selectScope(opt.value)}
            className={cn(
              "h-full px-3 text-[0.8rem] transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
