import { RotateCw } from "lucide-react";
import Image from "next/image";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import type { HobbySlug, ItemStatus } from "@/lib/points";
import { cn } from "@/lib/utils";
import type { ItemRow } from "@/types/item";
import { ExpandToggle } from "./expand-toggle";
import { ItemRowActions } from "./item-row-actions";
import { RefreshShowButton } from "./refresh-show-button";

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
  tv: "TMDB",
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

function TitleBlock({
  item,
  hobbySlug,
  showNote = true,
}: {
  item: ItemRow;
  hobbySlug: HobbySlug;
  showNote?: boolean;
}) {
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
      {showNote ? (
        <p
          className={cn(
            "mt-1 truncate font-mono text-xs",
            item.note ? "text-warning/80" : "invisible",
          )}
          title={item.note ?? undefined}
        >
          {item.note ?? "—"}
        </p>
      ) : null}
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

function StatusCell({ status }: { status: ItemStatus | null }) {
  if (status == null) return <span className="text-muted-foreground">—</span>;
  if (status === "in_progress") {
    return (
      <Badge className="border-transparent bg-accent text-accent-foreground">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

function RatingCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono text-accent">★ {value}</span>;
}

function RevisitCell({ wouldRevisit }: { wouldRevisit: boolean }) {
  if (!wouldRevisit) return <span className="text-muted-foreground">—</span>;
  return <RotateCw className="size-4 text-accent" aria-label="Again" />;
}

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
              <th className="w-28 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              if (item.kind === "show_parent") {
                const isOpen = expanded.has(item.id);
                return (
                  <Fragment key={item.id}>
                    <tr id={`item-${item.id}`} className="border-t border-border bg-muted/10">
                      <td className="px-3 py-2">
                        <Poster src={item.imageUrl} alt={item.title} size={40} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-start gap-1">
                          <ExpandToggle itemId={item.id} expanded={isOpen} />
                          <TitleBlock item={item} hobbySlug={hobbySlug} showNote={false} />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <RatingCell value={aggregateRating(item.children)} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{item.addedYear}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {aggregateLabel(item.children)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-muted-foreground">—</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <RefreshShowButton itemId={item.id} />
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
                          <tr key={child.id} className="border-t border-border hover:bg-muted/30">
                            <td className="py-2 pr-3 pl-5">
                              <Poster src={child.imageUrl} alt={child.title} size={32} />
                            </td>
                            <td className="px-3 py-2 pl-2">
                              <TitleBlock item={child} hobbySlug={hobbySlug} />
                            </td>
                            <td className="px-3 py-2">
                              <RatingCell value={child.userRating} />
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{child.addedYear}</td>
                            <td className="px-3 py-2">
                              <StatusCell status={child.status} />
                            </td>
                            <td className="px-3 py-2">
                              <RevisitCell wouldRevisit={child.wouldRevisit} />
                            </td>
                            <td className="px-3 py-2">
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
                <tr
                  key={item.id}
                  id={`item-${item.id}`}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-3 py-2">
                    <Poster src={item.imageUrl} alt={item.title} size={40} />
                  </td>
                  <td className="px-3 py-2">
                    <TitleBlock item={item} hobbySlug={hobbySlug} />
                  </td>
                  <td className="px-3 py-2">
                    <RatingCell value={item.userRating} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.addedYear}</td>
                  <td className="px-3 py-2">
                    <StatusCell status={item.status} />
                  </td>
                  <td className="px-3 py-2">
                    <RevisitCell wouldRevisit={item.wouldRevisit} />
                  </td>
                  <td className="px-3 py-2">
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
      </div>

      <div className="space-y-2 md:hidden">
        {items.map((item) => {
          if (item.kind === "show_parent") {
            const isOpen = expanded.has(item.id);
            return (
              <div
                key={item.id}
                id={`item-${item.id}`}
                className="rounded-lg border border-border bg-muted/10 p-3"
              >
                <div className="flex gap-3">
                  <Poster src={item.imageUrl} alt={item.title} size={48} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1">
                        <ExpandToggle itemId={item.id} expanded={isOpen} />
                        <TitleBlock item={item} hobbySlug={hobbySlug} showNote={false} />
                      </div>
                      <div className="flex items-center gap-1">
                        <RefreshShowButton itemId={item.id} />
                        <ItemRowActions
                          item={item}
                          showEdit={false}
                          deleteDescription={`Remove "${item.title}" and all its seasons. This cannot be undone.`}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{aggregateLabel(item.children)}</span>
                      {aggregateRating(item.children) != null ? (
                        <span className="font-mono text-accent">
                          ★ {aggregateRating(item.children)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {isOpen ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3 pl-4">
                    {item.children?.map((child) => (
                      <div
                        key={child.id}
                        className="flex gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <Poster src={child.imageUrl} alt={child.title} size={40} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <TitleBlock item={child} hobbySlug={hobbySlug} />
                            <ItemRowActions item={child} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {child.userRating != null ? (
                              <span className="font-mono text-accent">★ {child.userRating}</span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusCell status={child.status} />
                            {child.wouldRevisit ? (
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
                ) : null}
              </div>
            );
          }

          const isFlatTv = item.kind === "flat" && hobbySlug === "tv";
          return (
            <div
              key={item.id}
              id={`item-${item.id}`}
              className="flex gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Poster src={item.imageUrl} alt={item.title} size={56} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <TitleBlock item={item} hobbySlug={hobbySlug} />
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
                  <StatusCell status={item.status} />
                  {item.wouldRevisit ? (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <RotateCw className="size-3" />
                      Again?
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
