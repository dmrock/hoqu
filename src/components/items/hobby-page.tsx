import { and, asc, desc, eq, inArray, type SQL } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items } from "@/lib/db/schema";
import { type ItemsFilter, parseItemsFilter } from "@/lib/items-filter";
import type { HobbySlug, ItemStatus } from "@/lib/points";
import type { ItemRow } from "@/types/item";
import { AddItemDialog } from "./add-item-dialog";
import { ItemsList } from "./items-list";
import { ItemsToolbar } from "./items-toolbar";

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

  const conditions: SQL[] = [
    eq(items.userId, session.user.id),
    eq(items.hobbyId, hobby.id),
    inArray(items.status, filter.status),
  ];
  if (filter.revisitOnly) conditions.push(eq(items.wouldRevisit, true));

  const rows = await db
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
    })
    .from(items)
    .where(and(...conditions))
    .orderBy(...orderFor(filter.sort));

  const userItems: ItemRow[] = rows.map(({ createdAt, ...r }) => ({
    ...r,
    addedYear: new Date(createdAt).getFullYear(),
    status: r.status as ItemStatus,
  }));

  const ownedIdsRows = await db
    .select({ externalId: items.externalId })
    .from(items)
    .where(and(eq(items.userId, session.user.id), eq(items.hobbyId, hobby.id)));
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
        <ItemsList items={userItems} hobbySlug={hobbySlug} />
      )}
    </div>
  );
}
