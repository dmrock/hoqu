"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AddItemDialog } from "@/components/items/add-item-dialog";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/lib/api/search";
import type { HobbySlug } from "@/lib/points";
import { cn } from "@/lib/utils";

export function NewReleasesRow({
  title,
  hobbySlug,
  items,
  ownedExternalIds,
  emptyHint,
}: {
  title: string;
  hobbySlug: HobbySlug;
  items: SearchResult[];
  ownedExternalIds: string[];
  emptyHint: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const owned = useMemo(() => new Set(ownedExternalIds), [ownedExternalIds]);

  return (
    <section className="space-y-2">
      <h3 className="border-l-2 border-accent pl-2 font-mono text-xs text-foreground uppercase tracking-wider">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        // overflow-x-auto implicitly clips overflow-y, so the hover ring on each
        // poster needs symmetric breathing room on every side, not just bottom.
        <div className="-m-1 flex gap-3 overflow-x-auto p-1 pb-2">
          {items.map((item) => {
            const isOwned = owned.has(item.externalId);
            return (
              <button
                key={item.externalId}
                type="button"
                disabled={isOwned}
                onClick={() => {
                  setSelected(item);
                  setOpen(true);
                }}
                aria-label={`Add ${item.title} to collection`}
                className="group w-28 shrink-0 cursor-pointer text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div
                  className={cn(
                    "relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-1 ring-transparent transition-all",
                    !isOwned && "group-hover:ring-primary group-focus-visible:ring-primary",
                  )}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-200 group-enabled:group-hover:scale-105"
                    />
                  ) : null}
                  {isOwned ? (
                    <Badge
                      variant="secondary"
                      className="absolute top-1 left-1 text-[10px] uppercase tracking-wider"
                    >
                      Owned
                    </Badge>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all duration-200 group-hover:bg-background/55 group-hover:opacity-100 group-focus-visible:bg-background/55 group-focus-visible:opacity-100">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background/40">
                        <Plus className="size-5" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-1 truncate text-xs font-medium" title={item.title}>
                  {item.title}
                </p>
                {item.year ? <p className="text-xs text-muted-foreground">{item.year}</p> : null}
              </button>
            );
          })}
        </div>
      )}
      <AddItemDialog
        hobbySlug={hobbySlug}
        existingExternalIds={ownedExternalIds}
        initialSelection={selected}
        defaultStatus="planned"
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelected(null);
        }}
        trigger={null}
      />
    </section>
  );
}

export function NewReleasesSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <h3 className="border-l-2 border-accent pl-2 font-mono text-xs text-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="w-28 shrink-0 animate-pulse">
            <div className="aspect-2/3 rounded-lg bg-muted" />
            <div className="mt-1 h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
