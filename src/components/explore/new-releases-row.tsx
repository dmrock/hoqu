"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { AddItemDialog } from "@/components/items/add-item-dialog";
import { Badge } from "@/components/ui/badge";
import { PosterTile } from "@/components/ui/poster-tile";
import { RowLabel } from "@/components/ui/row-label";
import type { SearchResult } from "@/lib/api/search";
import type { HobbySlug } from "@/lib/points";

/** Posters eagerly loaded when `eager` is set — enough to cover the narrowest
 *  grid (3 across) plus the leading edge of a wide one. */
const EAGER_COUNT = 4;

export function AddOverlay() {
  return (
    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background/40">
      <Plus className="size-5" strokeWidth={2.5} />
    </div>
  );
}

export function OwnedBadge() {
  return (
    <Badge
      variant="secondary"
      className="absolute right-1 bottom-1 text-[10px] uppercase tracking-wider"
    >
      Owned
    </Badge>
  );
}

export function NewReleasesRow({
  title,
  hobbySlug,
  items,
  ownedExternalIds,
  emptyHint,
  eager = false,
}: {
  title: string;
  hobbySlug: HobbySlug;
  items: SearchResult[];
  ownedExternalIds: string[];
  emptyHint: string;
  /** Set on the row that renders above the fold; its lead posters win LCP. */
  eager?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const owned = useMemo(() => new Set(ownedExternalIds), [ownedExternalIds]);

  return (
    <section className="space-y-2">
      <RowLabel>{title}</RowLabel>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        // Columns are tuned so a poster stays ~115-150px wide at every step,
        // and the 8 fetched items fill exactly one row from xl up.
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {items.map((item, i) => {
            const isOwned = owned.has(item.externalId);
            return (
              <PosterTile
                key={item.externalId}
                title={item.title}
                imageUrl={item.imageUrl}
                onClick={() => {
                  setSelected(item);
                  setOpen(true);
                }}
                disabled={isOwned}
                aria-label={`Add ${item.title} to collection`}
                eager={eager && i < EAGER_COUNT}
                badge={isOwned ? <OwnedBadge /> : null}
                overlay={<AddOverlay />}
                meta={
                  item.year ? <p className="text-xs text-muted-foreground">{item.year}</p> : null
                }
              />
            );
          })}
        </div>
      )}
      <AddItemDialog
        hobbySlug={hobbySlug}
        initialSelection={selected}
        defaultStatus="planned"
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelected(null);
        }}
      />
    </section>
  );
}

export function NewReleasesSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <RowLabel>{title}</RowLabel>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 8 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i}>
            <div className="skeleton aspect-2/3 rounded-lg" />
            <div className="skeleton mt-1.5 h-3 w-20 max-w-full rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}
