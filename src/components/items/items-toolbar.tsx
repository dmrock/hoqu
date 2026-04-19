"use client";

import { ArrowDownUp, ListFilter, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type ItemsFilter,
  isStatusFilterActive,
  SORT_OPTIONS,
  type SortValue,
  STATUS_OPTIONS,
} from "@/lib/items-filter";
import type { ItemStatus } from "@/lib/points";

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

  const statusActive = isStatusFilterActive(filter.status);
  const statusSet = useMemo(() => new Set(filter.status), [filter.status]);

  function toggleStatus(value: ItemStatus, checked: boolean) {
    const next = new Set(statusSet);
    if (checked) next.add(value);
    else next.delete(value);

    updateParams((params) => {
      if (next.size === 0 || next.size === STATUS_OPTIONS.length) {
        params.delete("status");
      } else {
        params.set(
          "status",
          STATUS_OPTIONS.filter((s) => next.has(s.value))
            .map((s) => s.value)
            .join(","),
        );
      }
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

  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={pending || undefined}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={statusActive ? "default" : "outline"}
            size="sm"
            aria-label="Filter by status"
          >
            <ListFilter />
            Status
            {statusActive ? (
              <span className="font-mono text-xs">({filter.status.length})</span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuLabel>Show statuses</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map((s) => (
            <DropdownMenuCheckboxItem
              key={s.value}
              checked={statusSet.has(s.value)}
              onCheckedChange={(c) => toggleStatus(s.value, c === true)}
              onSelect={(e) => e.preventDefault()}
            >
              {s.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant={filter.revisitOnly ? "default" : "outline"}
        size="sm"
        aria-pressed={filter.revisitOnly}
        onClick={toggleRevisit}
      >
        <Sparkles />
        Would revisit
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
  );
}
