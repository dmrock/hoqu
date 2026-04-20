import { RotateCw } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { HobbySlug, ItemStatus } from "@/lib/points";
import { cn } from "@/lib/utils";
import type { ItemRow } from "@/types/item";
import { ItemRowActions } from "./item-row-actions";

const STATUS_LABEL: Record<ItemStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  planned: "Planned",
  dropped: "Dropped",
};

const STATUS_VARIANT: Record<ItemStatus, "default" | "secondary" | "outline" | "ghost"> = {
  completed: "default",
  in_progress: "secondary",
  planned: "outline",
  dropped: "ghost",
};

const EXTERNAL_RATING_LABEL: Record<HobbySlug, string> = {
  movies: "TMDB",
  games: "Metacritic",
  books: "",
};

function Poster({ src, alt, size }: { src: string | null; alt: string; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded bg-muted"
      style={{ width: size, height: Math.round(size * 1.5) }}
    >
      {src ? <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" /> : null}
    </div>
  );
}

function formatRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function TitleBlock({ item, hobbySlug }: { item: ItemRow; hobbySlug: HobbySlug }) {
  const ratingLabel = EXTERNAL_RATING_LABEL[hobbySlug];
  return (
    <div className="min-w-0">
      <p className="truncate font-medium" title={item.title}>
        {item.title}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {item.year ? (
          <span>
            {item.year}
            {item.externalRating != null ? "," : ""}
          </span>
        ) : null}
        {item.externalRating != null ? (
          <span className="font-mono">
            {ratingLabel ? `${ratingLabel} ` : ""}★ {formatRating(item.externalRating)}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 truncate font-mono text-xs",
          item.note ? "text-warning/80" : "invisible",
        )}
        title={item.note ?? undefined}
      >
        {item.note ?? "—"}
      </p>
    </div>
  );
}

export function ItemsList({ items, hobbySlug }: { items: ItemRow[]; hobbySlug: HobbySlug }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="w-16 px-3 py-2"></th>
              <th className="px-3 py-2">Title</th>
              <th className="w-24 px-3 py-2">Your rate</th>
              <th className="w-24 px-3 py-2">Added</th>
              <th className="w-32 px-3 py-2">Status</th>
              <th className="w-20 px-3 py-2">Again?</th>
              <th className="w-24 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Poster src={item.imageUrl} alt={item.title} size={40} />
                </td>
                <td className="px-3 py-2">
                  <TitleBlock item={item} hobbySlug={hobbySlug} />
                </td>
                <td className="px-3 py-2">
                  {item.userRating != null ? (
                    <span className="font-mono text-accent">★ {item.userRating}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{item.addedYear}</td>
                <td className="px-3 py-2">
                  <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </td>
                <td className="px-3 py-2">
                  {item.wouldRevisit ? (
                    <RotateCw className="size-4 text-accent" aria-label="Again" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end">
                    <ItemRowActions item={item} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
            <Poster src={item.imageUrl} alt={item.title} size={56} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <TitleBlock item={item} hobbySlug={hobbySlug} />
                <ItemRowActions item={item} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Added {item.addedYear}</span>
                {item.userRating != null ? (
                  <span className="font-mono text-accent">★ {item.userRating}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[item.status]} className="text-xs">
                  {STATUS_LABEL[item.status]}
                </Badge>
                {item.wouldRevisit ? (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <RotateCw className="size-3" />
                    Again?
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
