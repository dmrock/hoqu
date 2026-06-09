import { CircleDashed, Star, Users } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { TrendingByHobby, TrendingItem } from "@/lib/activity-queries";
import type { HobbySlug } from "@/lib/points";

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

export function ActivityFeed({ data, emptyHint }: { data: TrendingByHobby; emptyHint: string }) {
  const isEmpty = CATEGORIES.every((c) => data[c.slug].length === 0);
  return (
    <div className="space-y-3">
      {isEmpty ? <p className="text-sm text-muted-foreground">{emptyHint}</p> : null}
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <TrendingRow key={c.slug} label={c.label} items={data[c.slug]} />
        ))}
      </div>
    </div>
  );
}

function TrendingRow({ label, items }: { label: string; items: TrendingItem[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="border-l-2 border-accent pl-2 font-mono text-xs text-foreground uppercase tracking-wider">
        {label}
      </h3>
      <div className="-m-1 flex gap-3 overflow-x-auto p-1 pb-2">
        {SLOTS.map((i) => {
          const item = items[i];
          return item ? (
            <TrendingCard key={item.externalId} item={item} />
          ) : (
            <EmptyCard key={`empty-${i}`} />
          );
        })}
      </div>
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

function TrendingCard({ item }: { item: TrendingItem }) {
  const peopleLabel = item.peopleCount === 1 ? "1 person" : `${item.peopleCount} people`;
  return (
    <div className="w-28 shrink-0">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.title} fill sizes="112px" className="object-cover" />
        ) : null}
        {item.combinedRate !== null ? (
          <Badge className="absolute top-1 left-1 gap-0.5 text-[10px]">
            <Star className="size-3" />
            {item.combinedRate.toFixed(1)}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 truncate text-xs font-medium" title={item.title}>
        {item.title}
      </p>
      {item.year ? <p className="text-xs text-muted-foreground">{item.year}</p> : null}
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="size-3 shrink-0" />
        {peopleLabel}
      </p>
    </div>
  );
}
