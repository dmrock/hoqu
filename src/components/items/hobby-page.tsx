import { and, asc, desc, eq, gte, inArray, isNull, or, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items } from "@/lib/db/schema";
import { type ItemsFilter, parseItemsFilter } from "@/lib/items-filter";
import type { HobbySlug, ItemStatus } from "@/lib/points";
import type { ItemKind, ItemRow } from "@/types/item";
import { AddItemDialog } from "./add-item-dialog";
import { ItemsList } from "./items-list";
import { ItemsToolbar } from "./items-toolbar";
import { RowFocus } from "./row-focus";

type SearchParamsInput = { [key: string]: string | string[] | undefined };

function orderFor(sort: ItemsFilter["sort"]) {
  switch (sort) {
    case "title-asc":
      return [asc(items.title)];
    case "title-desc":
      return [desc(items.title)];
    case "year-desc":
      return [desc(items.year), asc(items.title)];
    case "year-asc":
      return [asc(items.year), asc(items.title)];
    default:
      return [desc(items.updatedAt)];
  }
}

function deriveKind(row: { parentItemId: string | null; seasonCount: number | null }): ItemKind {
  if (row.parentItemId !== null) return "season";
  if ((row.seasonCount ?? 0) >= 2) return "show_parent";
  return "flat";
}

function parseExpanded(searchParams: SearchParamsInput): Set<string> {
  const raw = searchParams.expanded;
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.join(",") : "";
  return new Set(value.split(",").filter(Boolean));
}

function parseFocus(searchParams: SearchParamsInput): string | null {
  const raw = searchParams.focus;
  if (typeof raw !== "string") return null;
  return /^[0-9a-f-]{8,}$/i.test(raw) ? raw : null;
}

export async function HobbyPage({
  hobbySlug,
  title,
  searchParams,
}: {
  hobbySlug: HobbySlug;
  title: string;
  searchParams: SearchParamsInput;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const filter = parseItemsFilter(searchParams);
  const expanded = parseExpanded(searchParams);
  const focusId = parseFocus(searchParams);

  const [hobby] = await db
    .select({ id: hobbies.id })
    .from(hobbies)
    .where(eq(hobbies.slug, hobbySlug))
    .limit(1);

  if (!hobby) {
    return (
      <div className="space-y-2">
        <h1 className="font-pixel text-2xl">{title}</h1>
        <p className="text-destructive">
          Hobby not configured. Seed the database with `pnpm db:seed`.
        </p>
      </div>
    );
  }

  const topConditions: SQL[] = [
    eq(items.userId, session.user.id),
    eq(items.hobbyId, hobby.id),
    isNull(items.parentItemId),
  ];

  const passShowParent = gte(items.seasonCount, 2);
  const statusOr = or(inArray(items.status, filter.status), passShowParent);
  if (statusOr) topConditions.push(statusOr);

  if (filter.revisitOnly) {
    const revisitOr = or(eq(items.wouldRevisit, true), passShowParent);
    if (revisitOr) topConditions.push(revisitOr);
  }

  const topRows = await db
    .select({
      id: items.id,
      externalId: items.externalId,
      title: items.title,
      imageUrl: items.imageUrl,
      year: items.year,
      createdAt: items.createdAt,
      externalRating: items.externalRating,
      userRating: items.userRating,
      note: items.note,
      wouldRevisit: items.wouldRevisit,
      status: items.status,
      parentItemId: items.parentItemId,
      seasonNumber: items.seasonNumber,
      seasonCount: items.seasonCount,
    })
    .from(items)
    .where(and(...topConditions))
    .orderBy(...orderFor(filter.sort));

  const parentIds = topRows.filter((r) => deriveKind(r) === "show_parent").map((r) => r.id);

  let childRows: typeof topRows = [];
  if (parentIds.length > 0) {
    const childConditions: SQL[] = [
      eq(items.userId, session.user.id),
      inArray(items.parentItemId, parentIds),
      inArray(items.status, filter.status),
    ];
    if (filter.revisitOnly) childConditions.push(eq(items.wouldRevisit, true));

    childRows = await db
      .select({
        id: items.id,
        externalId: items.externalId,
        title: items.title,
        imageUrl: items.imageUrl,
        year: items.year,
        createdAt: items.createdAt,
        externalRating: items.externalRating,
        userRating: items.userRating,
        note: items.note,
        wouldRevisit: items.wouldRevisit,
        status: items.status,
        parentItemId: items.parentItemId,
        seasonNumber: items.seasonNumber,
        seasonCount: items.seasonCount,
      })
      .from(items)
      .where(and(...childConditions))
      .orderBy(asc(items.seasonNumber));
  }

  const toItemRow = (r: (typeof topRows)[number]): ItemRow => {
    const { createdAt, ...rest } = r;
    return {
      ...rest,
      addedYear: new Date(createdAt).getFullYear(),
      status: rest.status as ItemStatus | null,
      kind: deriveKind(rest),
    };
  };

  const childrenByParent = new Map<string, ItemRow[]>();
  for (const r of childRows) {
    const list = childrenByParent.get(r.parentItemId ?? "") ?? [];
    list.push(toItemRow(r));
    childrenByParent.set(r.parentItemId ?? "", list);
  }

  const userItems: ItemRow[] = topRows.map((r) => {
    const row = toItemRow(r);
    if (row.kind === "show_parent") {
      row.children = childrenByParent.get(row.id) ?? [];
    }
    return row;
  });

  const ownedIdsRows = await db
    .select({ externalId: items.externalId })
    .from(items)
    .where(
      and(
        eq(items.userId, session.user.id),
        eq(items.hobbyId, hobby.id),
        isNull(items.parentItemId),
      ),
    );
  const existingExternalIds = ownedIdsRows.map((r) => r.externalId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pixel text-2xl">{title}</h1>
        <AddItemDialog hobbySlug={hobbySlug} existingExternalIds={existingExternalIds} />
      </div>
      <ItemsToolbar filter={filter} />
      {existingExternalIds.length === 0 ? (
        <p className="text-muted-foreground">
          No {title.toLowerCase()} yet. Click Add to search and log your first.
        </p>
      ) : userItems.length === 0 ? (
        <p className="text-muted-foreground">No {title.toLowerCase()} match the current filters.</p>
      ) : (
        <ItemsList items={userItems} hobbySlug={hobbySlug} expanded={expanded} />
      )}
      <RowFocus focusId={focusId} />
    </div>
  );
}
