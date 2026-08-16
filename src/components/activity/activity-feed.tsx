"use client";

import { CircleDashed, Plus, Star, Users } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AddItemDialog } from "@/components/items/add-item-dialog";
import { Badge } from "@/components/ui/badge";
import type { OwnedByHobby, TrendingByHobby, TrendingItem } from "@/lib/activity-queries";
import type { SearchResult } from "@/lib/api/search";
import type { HobbySlug } from "@/lib/points";
import { cn } from "@/lib/utils";

// Order matters: the 2-column grid fills row 1 with movies + tv, row 2 with games + books.
const CATEGORIES: { slug: HobbySlug; label: string }[] = [
  { slug: "movies", label: "Movies" },
  { slug: "tv", label: "TV Shows" },
  { slug: "games", label: "Games" },
  { slug: "books", label: "Books" },
];

// Each category renders this many fixed slots so cards never reflow: a new item
// drops into the next placeholder's exact position instead of shifting siblings.
const SLOTS = [0, 1, 2];

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
  const isEmpty = CATEGORIES.every((c) => data[c.slug].length === 0);
  return (
    <div className="space-y-3">
      {isEmpty ? <p className="text-sm text-muted-foreground">{emptyHint}</p> : null}
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <TrendingRow
            key={c.slug}
            hobbySlug={c.slug}
            label={c.label}
            items={data[c.slug]}
            ownedExternalIds={ownedByHobby?.[c.slug]}
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
      <h3 className="border-l-2 border-accent pl-2 font-mono text-xs text-foreground uppercase tracking-wider">
        {label}
      </h3>
      <div className="-m-1 flex gap-3 overflow-x-auto p-1 pb-2">
        {SLOTS.map((i) => {
          const item = items[i];
          if (!item) return <EmptyCard key={`empty-${i}`} />;
          return (
            <TrendingCard
              key={item.externalId}
              item={item}
              addable={addable}
              owned={owned.has(item.externalId)}
              onAdd={() => {
                setSelected(item);
                setOpen(true);
              }}
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

function EmptyCard() {
  return (
    <div className="w-28 shrink-0">
      <div className="flex aspect-2/3 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
        <CircleDashed className="size-6 opacity-40" />
      </div>
    </div>
  );
}

function TrendingCard({
  item,
  addable,
  owned,
  onAdd,
}: {
  item: TrendingItem;
  addable: boolean;
  owned: boolean;
  onAdd: () => void;
}) {
  const peopleLabel = item.peopleCount === 1 ? "1 person" : `${item.peopleCount} people`;
  const interactive = addable && !owned;

  const poster = (
    <div
      className={cn(
        "relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-1 ring-transparent transition-all",
        interactive && "group-hover:ring-primary group-focus-visible:ring-primary",
      )}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="112px"
          className={cn(
            "object-cover transition-transform duration-200",
            interactive && "group-hover:scale-105",
          )}
        />
      ) : null}
      {item.combinedRate !== null ? (
        <Badge className="absolute top-1 left-1 gap-0.5 text-[10px]">
          <Star className="size-3" />
          {item.combinedRate.toFixed(1)}
        </Badge>
      ) : null}
      {/* Bottom corner, not top-right: the rating badge already claims the top
          row, and the two together are wider than a 112px poster. */}
      {addable && owned ? (
        <Badge
          variant="secondary"
          className="absolute right-1 bottom-1 text-[10px] uppercase tracking-wider"
        >
          Owned
        </Badge>
      ) : null}
      {interactive ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all duration-200 group-hover:bg-background/55 group-hover:opacity-100 group-focus-visible:bg-background/55 group-focus-visible:opacity-100">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background/40">
            <Plus className="size-5" strokeWidth={2.5} />
          </div>
        </div>
      ) : null}
    </div>
  );

  const meta = (
    <>
      <p className="mt-1 truncate text-xs font-medium" title={item.title}>
        {item.title}
      </p>
      {item.year ? <p className="text-xs text-muted-foreground">{item.year}</p> : null}
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="size-3 shrink-0" />
        {peopleLabel}
      </p>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${item.title} to collection`}
        className="group w-28 shrink-0 cursor-pointer text-left"
      >
        {poster}
        {meta}
      </button>
    );
  }

  return (
    <div className={cn("w-28 shrink-0", addable && owned && "opacity-60")}>
      {poster}
      {meta}
    </div>
  );
}
