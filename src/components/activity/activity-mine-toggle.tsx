"use client";

import { Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function ActivityMineToggle({ includeSelf }: { includeSelf: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    // Default is OFF, so only the ON state needs a param.
    if (includeSelf) params.delete("mine");
    else params.set("mine", "1");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={includeSelf}
      onClick={toggle}
      data-pending={pending || undefined}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[0.8rem] transition-colors",
        includeSelf
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-3.5 items-center justify-center rounded-[4px] border",
          includeSelf ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {includeSelf ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      Include my items
    </button>
  );
}
