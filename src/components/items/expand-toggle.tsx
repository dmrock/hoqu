"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ExpandToggle({ itemId, expanded }: { itemId: string; expanded: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    const current = (params.get("expanded") ?? "").split(",").filter(Boolean);
    const set = new Set(current);
    if (set.has(itemId)) set.delete(itemId);
    else set.add(itemId);

    if (set.size === 0) params.delete("expanded");
    else params.set("expanded", [...set].join(","));

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={expanded ? "Collapse seasons" : "Expand seasons"}
      aria-expanded={expanded}
      disabled={pending}
      onClick={toggle}
    >
      {expanded ? <ChevronDown /> : <ChevronRight />}
    </Button>
  );
}
