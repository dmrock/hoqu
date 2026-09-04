import { RotateCw } from "lucide-react";
import Image from "next/image";
import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { HobbySlug } from "@/lib/points";
import { cn } from "@/lib/utils";
import type { ItemRow } from "@/types/item";
import { EditShowSeasons } from "./edit-show-seasons";
import { ExpandToggle } from "./expand-toggle";
import { ItemRowActions } from "./item-row-actions";
import { RefreshShowButton } from "./refresh-show-button";
import { StatusBadge } from "./status-badge";

const EXTERNAL_RATING_LABEL: Record<HobbySlug, string> = {
  movies: "TMDB",
  tv: "TMDB",
  games: "IGDB",
  books: "",
};

function Poster({ src, alt, size }: { src: string | null; alt: string; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded bg-muted ring-1 ring-white/5"
      style={{ width: size, height: Math.round(size * 1.5) }}
    >
      {src ? <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" /> : null}
    </div>
  );
}

function formatRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * `note`: "reserve" keeps a blank line when there's no note so table rows stay
 * a uniform height; "inline" collapses it, which is what the stacked cards want.
 * `showYear`: off in the table, where the Released column already carries it.
 */
function TitleBlock({
  item,
  hobbySlug,
  note = "reserve",
  showYear = true,
}: {
  item: ItemRow;
  hobbySlug: HobbySlug;
  note?: "reserve" | "inline" | "none";
  showYear?: boolean;
}) {
  const ratingLabel = EXTERNAL_RATING_LABEL[hobbySlug];
  return (
    <div className="min-w-0">
      <p className="truncate font-medium" title={item.title}>
        {item.title}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {showYear && item.year ? (
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
      {note === "none" || (note === "inline" && !item.note) ? null : (
        <p
          className={cn(
            "mt-1 truncate font-mono text-xs",
            item.note ? "text-warning/80" : "invisible",
          )}
          title={item.note ?? undefined}
        >
          {item.note ?? "—"}
        </p>
      )}
    </div>
  );
}

function aggregateLabel(children: ItemRow[] | undefined): string {
  if (!children || children.length === 0) return "—";
  const completed = children.filter((c) => c.status === "completed").length;
  return `${completed}/${children.length} done`;
}

function aggregateRating(children: ItemRow[] | undefined): number | null {
  if (!children || children.length === 0) return null;
  const rated = children.filter((c) => c.userRating != null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, c) => acc + (c.userRating as number), 0);
  return Math.round(sum / rated.length);
}

function RatingCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono text-accent">★ {value}</span>;
}

function RevisitCell({ wouldRevisit }: { wouldRevisit: boolean }) {
  if (!wouldRevisit) return <span className="text-muted-foreground">—</span>;
  return <RotateCw className="size-4 text-accent" aria-label="Again" />;
}

function AgainBadge() {
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <RotateCw className="size-3" />
      Again?
    </Badge>
  );
}

const CELL = "px-3 py-2";
const ROW_HOVER = "border-t border-border transition-colors hover:bg-white/[0.025]";

export function ItemsList({
  items,
  hobbySlug,
  expanded,
}: {
  items: ItemRow[];
  hobbySlug: HobbySlug;
  expanded: Set<string>;
}) {
  return (
    <>
      {/* Cards until lg, not md: at exactly 768px the expanded sidebar leaves
          ~480px of content, and the fixed columns alone need more than that.
          min-w keeps the title column from collapsing at the low end of lg —
          the container scrolls instead. */}
      <Card padding="none" className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[44rem] table-fixed text-sm">
          <thead className="bg-white/[0.03] text-left font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="w-14 px-3 py-2.5"></th>
              <th className="px-3 py-2.5">Title</th>
              <th className="w-24 px-3 py-2.5">Released</th>
              <th className="w-24 px-3 py-2.5">Your rate</th>
              <th className="w-20 px-3 py-2.5">Added</th>
              <th className="w-32 px-3 py-2.5">Status</th>
              <th className="w-20 px-3 py-2.5">Again?</th>
              <th className="w-24 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              if (item.kind === "show_parent") {
                const isOpen = expanded.has(item.id);
                return (
                  <Fragment key={item.id}>
                    <tr id={`item-${item.id}`} className="border-t border-border bg-primary/[0.04]">
                      <td className={CELL}>
                        <Poster src={item.imageUrl} alt={item.title} size={40} />
                      </td>
                      <td className={CELL}>
                        <div className="flex items-start gap-1">
                          <ExpandToggle itemId={item.id} expanded={isOpen} />
                          <TitleBlock
                            item={item}
                            hobbySlug={hobbySlug}
                            note="none"
                            showYear={false}
                          />
                        </div>
                      </td>
                      <td className={cn(CELL, "text-muted-foreground")}>{item.year ?? "—"}</td>
                      <td className={CELL}>
                        <RatingCell value={aggregateRating(item.children)} />
                      </td>
                      <td className={cn(CELL, "text-muted-foreground")}>{item.addedYear}</td>
                      <td className={cn(CELL, "font-mono text-xs text-muted-foreground")}>
                        {aggregateLabel(item.children)}
                      </td>
                      <td className={CELL}>
                        <span className="text-muted-foreground">—</span>
                      </td>
                      <td className={CELL}>
                        <div className="flex items-center justify-end gap-1">
                          <RefreshShowButton itemId={item.id} />
                          <EditShowSeasons item={item} />
                          <ItemRowActions
                            item={item}
                            showEdit={false}
                            deleteDescription={`Remove "${item.title}" and all its seasons. This cannot be undone.`}
                          />
                        </div>
                      </td>
                    </tr>
                    {isOpen
                      ? item.children?.map((child) => (
                          <tr key={child.id} className={ROW_HOVER}>
                            <td className="py-2 pr-3 pl-5">
                              <Poster src={child.imageUrl} alt={child.title} size={32} />
                            </td>
                            <td className={cn(CELL, "pl-2")}>
                              <TitleBlock item={child} hobbySlug={hobbySlug} showYear={false} />
                            </td>
                            <td className={cn(CELL, "text-muted-foreground")}>
                              {child.year ?? "—"}
                            </td>
                            <td className={CELL}>
                              <RatingCell value={child.userRating} />
                            </td>
                            <td className={cn(CELL, "text-muted-foreground")}>{child.addedYear}</td>
                            <td className={CELL}>
                              <StatusBadge status={child.status} />
                            </td>
                            <td className={CELL}>
                              <RevisitCell wouldRevisit={child.wouldRevisit} />
                            </td>
                            <td className={CELL}>
                              <div className="flex justify-end">
                                <ItemRowActions item={child} />
                              </div>
                            </td>
                          </tr>
                        ))
                      : null}
                  </Fragment>
                );
              }

              const isFlatTv = item.kind === "flat" && hobbySlug === "tv";
              return (
                <tr key={item.id} id={`item-${item.id}`} className={ROW_HOVER}>
                  <td className={CELL}>
                    <Poster src={item.imageUrl} alt={item.title} size={40} />
                  </td>
                  <td className={CELL}>
                    <TitleBlock item={item} hobbySlug={hobbySlug} showYear={false} />
                  </td>
                  <td className={cn(CELL, "text-muted-foreground")}>{item.year ?? "—"}</td>
                  <td className={CELL}>
                    <RatingCell value={item.userRating} />
                  </td>
                  <td className={cn(CELL, "text-muted-foreground")}>{item.addedYear}</td>
                  <td className={CELL}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className={CELL}>
                    <RevisitCell wouldRevisit={item.wouldRevisit} />
                  </td>
                  <td className={CELL}>
                    <div className="flex items-center justify-end gap-1">
                      {isFlatTv ? <RefreshShowButton itemId={item.id} /> : null}
                      <ItemRowActions item={item} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="space-y-2 lg:hidden">
        {items.map((item) => {
          if (item.kind === "show_parent") {
            const isOpen = expanded.has(item.id);
            return (
              <Card key={item.id} id={`item-${item.id}`} padding="sm" className="from-primary/5">
                <div className="flex gap-3">
                  <Poster src={item.imageUrl} alt={item.title} size={48} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1">
                        <ExpandToggle itemId={item.id} expanded={isOpen} />
                        <TitleBlock item={item} hobbySlug={hobbySlug} note="none" />
                      </div>
                      <div className="flex items-center gap-1">
                        <RefreshShowButton itemId={item.id} />
                        <EditShowSeasons item={item} />
                        <ItemRowActions
                          item={item}
                          showEdit={false}
                          deleteDescription={`Remove "${item.title}" and all its seasons. This cannot be undone.`}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                      <span>{aggregateLabel(item.children)}</span>
                      {aggregateRating(item.children) != null ? (
                        <span className="text-accent">★ {aggregateRating(item.children)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {isOpen ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3 pl-4">
                    {item.children?.map((child) => (
                      <Card key={child.id} padding="sm" variant="muted" className="flex gap-3">
                        <Poster src={child.imageUrl} alt={child.title} size={40} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <TitleBlock item={child} hobbySlug={hobbySlug} note="inline" />
                            <ItemRowActions item={child} />
                          </div>
                          {child.userRating != null ? (
                            <p className="font-mono text-xs text-accent">★ {child.userRating}</p>
                          ) : null}
                          <div className="flex items-center gap-2">
                            <StatusBadge status={child.status} />
                            {child.wouldRevisit ? <AgainBadge /> : null}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          }

          const isFlatTv = item.kind === "flat" && hobbySlug === "tv";
          return (
            <Card key={item.id} id={`item-${item.id}`} padding="sm" className="flex gap-3">
              <Poster src={item.imageUrl} alt={item.title} size={56} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <TitleBlock item={item} hobbySlug={hobbySlug} note="inline" />
                  <div className="flex items-center gap-1">
                    {isFlatTv ? <RefreshShowButton itemId={item.id} /> : null}
                    <ItemRowActions item={item} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>Added {item.addedYear}</span>
                  {item.userRating != null ? (
                    <span className="font-mono text-accent">★ {item.userRating}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.wouldRevisit ? <AgainBadge /> : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
