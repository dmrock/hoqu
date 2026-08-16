import { and, asc, desc, eq, gte, inArray, isNull, or, type SQL, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items } from "@/lib/db/schema";
import {
  ITEMS_PAGE_SIZE,
  type ItemsFilter,
  pageCount,
  pageForRank,
  parseItemsFilter,
  parsePageParam,
} from "@/lib/items-filter";
import type { HobbySlug, ItemStatus } from "@/lib/points";
import type { ItemKind, ItemRow } from "@/types/item";
import { ItemsList } from "./items-list";
import { ItemsPagination } from "./items-pagination";
import { ItemsToolbar } from "./items-toolbar";
import { RowFocus } from "./row-focus";

type SearchParamsInput = { [key: string]: string | string[] | undefined };

// Every sort ends on the id so LIMIT/OFFSET pages never shuffle rows that tie
// on the visible key (same updatedAt from a batch write, same title, ...).
function orderFor(sort: ItemsFilter["sort"]) {
  switch (sort) {
    case "title-asc":
      return [asc(items.title), asc(items.id)];
    case "title-desc":
      return [desc(items.title), asc(items.id)];
    case "year-desc":
      return [desc(items.year), asc(items.title), asc(items.id)];
    case "year-asc":
      return [asc(items.year), asc(items.title), asc(items.id)];
    default:
      return [desc(items.updatedAt), asc(items.id)];
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

// Strict UUID: the id is compared against items.id in SQL, and a loose value
// would make Postgres throw on the uuid cast instead of just not matching.
function parseFocus(searchParams: SearchParamsInput): string | null {
  const raw = searchParams.focus;
  if (typeof raw !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw) ? raw : null;
}

function buildPageHref(
  hobbySlug: HobbySlug,
  searchParams: SearchParamsInput,
  page: number,
  { keepFocus = false }: { keepFocus?: boolean } = {},
): string {
  const params = new URLSearchParams();
  const carried = ["status", "revisit", "sort", "expanded"];
  if (keepFocus) carried.push("focus");
  for (const key of carried) {
    const raw = searchParams[key];
    if (typeof raw === "string") params.set(key, raw);
    else if (Array.isArray(raw)) for (const v of raw) params.append(key, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/${hobbySlug}?${qs}` : `/${hobbySlug}`;
}

/**
 * Page the ?focus= item lands on under the current filter + sort, or null when
 * it doesn't match the filter. Rank comes from a row_number() window over the
 * same conditions and ordering as the page query.
 */
async function focusPageFor(
  focusId: string,
  topConditions: SQL[],
  sort: ItemsFilter["sort"],
): Promise<number | null> {
  const ranked = db
    .select({
      id: items.id,
      rank: sql<number>`row_number() over (order by ${sql.join(orderFor(sort), sql`, `)})`.as(
        "rank",
      ),
    })
    .from(items)
    .where(and(...topConditions))
    .as("ranked");

  const [row] = await db
    .select({ rank: ranked.rank })
    .from(ranked)
    .where(eq(ranked.id, focusId))
    .limit(1);
  return row ? pageForRank(Number(row.rank)) : null;
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

  const [filteredCount, totalCount] = await Promise.all([
    db.$count(items, and(...topConditions)),
    db.$count(
      items,
      and(
        eq(items.userId, session.user.id),
        eq(items.hobbyId, hobby.id),
        isNull(items.parentItemId),
      ),
    ),
  ]);

  const totalPages = pageCount(filteredCount);
  const page = Math.min(parsePageParam(searchParams), totalPages);

  // A ?focus= deep link (Cmd+K palette) may target a row beyond the current
  // page. Resolve its page first and put it in the URL, so RowFocus's later
  // focus-param cleanup replaces to the same page instead of bouncing to 1.
  if (focusId) {
    const focusPage = await focusPageFor(focusId, topConditions, filter.sort);
    if (focusPage !== null && focusPage !== page) {
      redirect(buildPageHref(hobbySlug, searchParams, focusPage, { keepFocus: true }));
    }
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
    .orderBy(...orderFor(filter.sort))
    .limit(ITEMS_PAGE_SIZE)
    .offset((page - 1) * ITEMS_PAGE_SIZE);

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

  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-2xl">{title}</h1>
      <ItemsToolbar filter={filter} hobbySlug={hobbySlug} />
      {totalCount === 0 ? (
        <p className="text-muted-foreground">
          No {title.toLowerCase()} yet. Click Add to search and log your first.
        </p>
      ) : filteredCount === 0 ? (
        <p className="text-muted-foreground">No {title.toLowerCase()} match the current filters.</p>
      ) : (
        <>
          <FadeIn>
            <ItemsList items={userItems} hobbySlug={hobbySlug} expanded={expanded} />
          </FadeIn>
          <ItemsPagination
            page={page}
            totalPages={totalPages}
            prevHref={page > 1 ? buildPageHref(hobbySlug, searchParams, page - 1) : null}
            nextHref={page < totalPages ? buildPageHref(hobbySlug, searchParams, page + 1) : null}
          />
        </>
      )}
      <RowFocus focusId={focusId} />
    </div>
  );
}
