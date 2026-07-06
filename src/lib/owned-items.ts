import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "./db";
import { hobbies, items } from "./db/schema";
import type { HobbySlug } from "./points";

/**
 * The subset of `externalIds` the user already owns in a hobby. Only top-level
 * rows count (`parentItemId` null), so multi-season TV maps to the show's
 * externalId. Callers pass just the ids currently on screen (search results,
 * trending cards), keeping the query and payload bounded by what's displayed.
 */
export async function filterOwnedExternalIds(
  userId: string,
  hobbySlug: HobbySlug,
  externalIds: string[],
): Promise<string[]> {
  if (externalIds.length === 0) return [];

  const rows = await db
    .select({ externalId: items.externalId })
    .from(items)
    .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
    .where(
      and(
        eq(items.userId, userId),
        eq(hobbies.slug, hobbySlug),
        isNull(items.parentItemId),
        inArray(items.externalId, externalIds),
      ),
    );
  return rows.map((r) => r.externalId);
}

/** Per-hobby variant for the activity feeds: candidates in, owned subset out. */
export async function filterOwnedByHobby(
  userId: string,
  candidates: Record<HobbySlug, { externalId: string }[]>,
): Promise<Record<HobbySlug, string[]>> {
  const slugs = Object.keys(candidates) as HobbySlug[];
  const owned = await Promise.all(
    slugs.map((slug) =>
      filterOwnedExternalIds(
        userId,
        slug,
        candidates[slug].map((c) => c.externalId),
      ),
    ),
  );
  return Object.fromEntries(slugs.map((slug, i) => [slug, owned[i]])) as Record<
    HobbySlug,
    string[]
  >;
}
