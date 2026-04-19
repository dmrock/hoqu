import { Sparkles } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { ItemStatus } from "@/lib/points";
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

function Rating({ value, muted }: { value: number | null; muted?: boolean }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const formatted = Number.isInteger(value) ? value : value.toFixed(1);
  return (
    <span className={`font-mono ${muted ? "text-muted-foreground" : "text-accent"}`}>
      ★ {formatted}
    </span>
  );
}

export function ItemsList({ items }: { items: ItemRow[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="w-16 px-3 py-2"></th>
              <th className="px-3 py-2">Title</th>
              <th className="w-20 px-3 py-2">Year</th>
              <th className="w-24 px-3 py-2">Your rate</th>
              <th className="w-24 px-3 py-2">External</th>
              <th className="w-32 px-3 py-2">Status</th>
              <th className="w-20 px-3 py-2">Revisit</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Poster src={item.imageUrl} alt={item.title} size={40} />
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium" title={item.title}>
                    {item.title}
                  </p>
                  {item.note ? (
                    <p className="truncate text-xs text-muted-foreground" title={item.note}>
                      {item.note}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{item.year ?? "—"}</td>
                <td className="px-3 py-2">
                  <Rating value={item.userRating} />
                </td>
                <td className="px-3 py-2">
                  <Rating value={item.externalRating} muted />
                </td>
                <td className="px-3 py-2">
                  <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </td>
                <td className="px-3 py-2">
                  {item.wouldRevisit ? (
                    <Sparkles className="size-4 text-accent" aria-label="Would revisit" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <ItemRowActions item={item} />
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
                <p className="truncate font-medium" title={item.title}>
                  {item.title}
                </p>
                <ItemRowActions item={item} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {item.year ? <span>{item.year}</span> : null}
                {item.userRating ? (
                  <span className="font-mono text-accent">★ {item.userRating}</span>
                ) : null}
                {item.externalRating ? (
                  <span className="font-mono">
                    ★{" "}
                    {Number.isInteger(item.externalRating)
                      ? item.externalRating
                      : item.externalRating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[item.status]} className="text-xs">
                  {STATUS_LABEL[item.status]}
                </Badge>
                {item.wouldRevisit ? (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Sparkles className="size-3" />
                    Revisit
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
