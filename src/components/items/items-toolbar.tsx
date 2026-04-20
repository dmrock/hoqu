"use client";

import { ArrowDownUp, RotateCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ItemsFilter, SORT_OPTIONS, type SortValue, STATUS_OPTIONS } from "@/lib/items-filter";
import type { ItemStatus } from "@/lib/points";
import { cn } from "@/lib/utils";

export function ItemsToolbar({ filter }: { filter: ItemsFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const activeStatus: ItemStatus | "all" = filter.status.length === 1 ? filter.status[0] : "all";

  function selectStatus(value: ItemStatus | "all") {
    updateParams((params) => {
      if (value === "all") params.delete("status");
      else params.set("status", value);
    });
  }

  function toggleRevisit() {
    updateParams((params) => {
      if (filter.revisitOnly) params.delete("revisit");
      else params.set("revisit", "1");
    });
  }

  function setSort(value: SortValue) {
    updateParams((params) => {
      if (value === "updated-desc") params.delete("sort");
      else params.set("sort", value);
    });
  }

  const sortLabel = SORT_OPTIONS.find((o) => o.value === filter.sort)?.label ?? "Sort";

  const tabs: { value: ItemStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    ...STATUS_OPTIONS,
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      data-pending={pending || undefined}
    >
      <div
        role="tablist"
        aria-label="Filter by status"
        className="inline-flex h-7 items-center overflow-hidden rounded-md border border-border bg-muted/40"
      >
        {tabs.map((t) => {
          const active = activeStatus === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectStatus(t.value)}
              className={cn(
                "h-full px-3 text-[0.8rem] transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={filter.revisitOnly ? "default" : "outline"}
          size="sm"
          aria-pressed={filter.revisitOnly}
          onClick={toggleRevisit}
        >
          <RotateCw />
          Again?
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Sort items">
              <ArrowDownUp />
              {sortLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filter.sort}
              onValueChange={(v) => setSort(v as SortValue)}
            >
              {SORT_OPTIONS.map((o) => (
                <DropdownMenuRadioItem key={o.value} value={o.value}>
                  {o.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
