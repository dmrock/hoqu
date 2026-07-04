"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshShow } from "@/app/(main)/items/actions";
import { Button } from "@/components/ui/button";
import { notifyUnlocks } from "@/lib/notify-unlocks";
import { cn } from "@/lib/utils";

export function RefreshShowButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await refreshShow({ itemId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      notifyUnlocks(res.unlocks);
      if (res.migrated || res.addedSeasons > 0) {
        const params = new URLSearchParams(searchParams.toString());
        const current = (params.get("expanded") ?? "").split(",").filter(Boolean);
        const set = new Set(current);
        set.add(itemId);
        params.set("expanded", [...set].join(","));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Check for new seasons"
      title={error ?? "Check for new seasons"}
      disabled={pending}
      onClick={handleClick}
    >
      <RefreshCw className={cn(pending && "animate-spin")} />
    </Button>
  );
}
