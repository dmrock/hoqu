"use client";

import { CircleDashed, Star, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { AddOverlay, OwnedBadge } from "@/components/explore/new-releases-row";
import { AddItemDialog } from "@/components/items/add-item-dialog";
import { Badge } from "@/components/ui/badge";
import { PosterTile } from "@/components/ui/poster-tile";
import { RowLabel } from "@/components/ui/row-label";
import type { OwnedByHobby, TrendingByHobby, TrendingItem } from "@/lib/activity-queries";
import type { SearchResult } from "@/lib/api/search";
import { HOBBY_META, HOBBY_ORDER } from "@/lib/hobby-meta";
import type { HobbySlug } from "@/lib/points";

// Each category renders this many fixed slots so cards never reflow: a new item
// drops into the next placeholder's exact position instead of shifting siblings.
const SLOTS = [0, 1, 2, 3];

// Trending carries the friends' average rating, not the external catalog rating,
// so the item we hand to the add dialog has no externalRating to seed.
function toSearchResult(item: TrendingItem): SearchResult {
  return {
    externalId: item.externalId,
    title: item.title,
    year: item.year,
    imageUrl: item.imageUrl,
    externalRating: null,
  };
}

export function ActivityFeed({
  data,
  emptyHint,
  ownedByHobby,
}: {
  data: TrendingByHobby;
  emptyHint: string;
  /** When provided, cards become "add to collection" buttons (owned items disabled). */
  ownedByHobby?: OwnedByHobby;
}) {
  const isEmpty = HOBBY_ORDER.every((slug) => data[slug].length === 0);
  return (
    <div className="space-y-3">
      {isEmpty ? <p className="text-sm text-muted-foreground">{emptyHint}</p> : null}
      {/* HOBBY_ORDER fills row 1 with movies + tv, row 2 with games + books. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        {HOBBY_ORDER.map((slug) => (
          <TrendingRow
            key={slug}
            hobbySlug={slug}
            label={HOBBY_META[slug].label}
            items={data[slug]}
            ownedExternalIds={ownedByHobby?.[slug]}
          />
        ))}
      </div>
    </div>
  );
}

function TrendingRow({
  hobbySlug,
  label,
  items,
  ownedExternalIds,
}: {
  hobbySlug: HobbySlug;
  label: string;
  items: TrendingItem[];
  /** `undefined` = read-only feed; an array (possibly empty) = addable feed. */
  ownedExternalIds?: string[];
}) {
  const addable = ownedExternalIds !== undefined;
  const owned = useMemo(() => new Set(ownedExternalIds ?? []), [ownedExternalIds]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TrendingItem | null>(null);

  return (
    <section className="flex flex-col gap-2">
      <RowLabel>{label}</RowLabel>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {SLOTS.map((i) => {
          const item = items[i];
          if (!item) return <EmptySlot key={`empty-${i}`} />;
          const isOwned = owned.has(item.externalId);
          const interactive = addable && !isOwned;
          const peopleLabel = item.peopleCount === 1 ? "1 person" : `${item.peopleCount} people`;
          return (
            <PosterTile
              key={item.externalId}
              title={item.title}
              imageUrl={item.imageUrl}
              sizes="(min-width: 640px) 180px, 45vw"
              onClick={
                interactive
                  ? () => {
                      setSelected(item);
                      setOpen(true);
                    }
                  : undefined
              }
              disabled={addable && isOwned}
              aria-label={interactive ? `Add ${item.title} to collection` : undefined}
              badge={
                <>
                  {item.combinedRate !== null ? (
                    <Badge className="absolute top-1 left-1 gap-0.5 text-[10px]">
                      <Star className="size-3" />
                      {item.combinedRate.toFixed(1)}
                    </Badge>
                  ) : null}
                  {/* Bottom corner, not top-right: the rating badge already claims the top
                      row, and the two together are wider than a 112px poster. */}
                  {addable && isOwned ? <OwnedBadge /> : null}
                </>
              }
              overlay={<AddOverlay />}
              meta={
                <>
                  {item.year ? <p className="text-xs text-muted-foreground">{item.year}</p> : null}
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3 shrink-0" />
                    {peopleLabel}
                  </p>
                </>
              }
            />
          );
        })}
      </div>
      {addable ? (
        <AddItemDialog
          hobbySlug={hobbySlug}
          initialSelection={selected ? toSearchResult(selected) : null}
          defaultStatus="planned"
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setSelected(null);
          }}
        />
      ) : null}
    </section>
  );
}

function EmptySlot() {
  return (
    <div className="min-w-0">
      <div className="pixel-grid flex aspect-2/3 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
        <CircleDashed className="size-6 opacity-40" />
      </div>
    </div>
  );
}
