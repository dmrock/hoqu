"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { type LeaderboardScope, SCOPE_OPTIONS } from "@/lib/leaderboards";

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
    <SegmentedControl
      items={SCOPE_OPTIONS}
      value={active}
      onChange={selectScope}
      aria-label="Leaderboard scope"
      pending={pending}
    />
  );
}
