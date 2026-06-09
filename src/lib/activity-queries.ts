import "server-only";

import { and, eq, gte, inArray, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import { guildMembers, hobbies, items } from "./db/schema";
import { getAcceptedFriendIds } from "./friendships";
import type { HobbySlug } from "./points";

const WINDOW_DAYS = 30;
const PER_CATEGORY = 3;
const HOBBY_SLUGS: HobbySlug[] = ["movies", "tv", "games", "books"];
// Statuses that count as "active". `planned` (wishlist) and `dropped` (abandoned)
// are not trending. Show-parent rows carry a null status and are handled separately.
const ACTIVE_STATUSES = ["completed", "in_progress"] as const;

export type TrendingItem = {
  externalId: string;
  title: string;
  imageUrl: string | null;
  year: number | null;
  /** AVG(user_rating) across everyone who added the item; null when nobody rated it. */
  combinedRate: number | null;
  /** Distinct adders (rows are unique per user × hobby × externalId). */
  peopleCount: number;
};

export type TrendingByHobby = Record<HobbySlug, TrendingItem[]>;

function emptyByHobby(): TrendingByHobby {
  return { movies: [], tv: [], games: [], books: [] };
}

function toItem(r: {
  externalId: string;
  title: string;
  imageUrl: string | null;
  year: number | null;
  combinedRate: number | null;
  peopleCount: number;
}): TrendingItem {
  return {
    externalId: r.externalId,
    title: r.title,
    imageUrl: r.imageUrl,
    year: r.year === null ? null : Number(r.year),
    combinedRate: r.combinedRate === null ? null : Number(r.combinedRate),
    peopleCount: Number(r.peopleCount),
  };
}

/**
 * Top items in one flat hobby (movies / games / books) for a set of users: dedup by
 * externalId, average the ratings, and rank by quality scaled by a dampened popularity
 * boost (`avg_rating × ln(1 + adders)`). Unrated items get a 0 quality factor, so they
 * only surface once the rated ones run out. `planned`/`dropped` are excluded.
 *
 * Recency keys off `updatedAt`, not `createdAt`, so an item added long ago that just
 * became active (e.g. planned → in_progress, or a fresh rating) re-enters the window.
 * `updatedAt` is always >= `createdAt`, so this still includes brand-new adds.
 */
async function loadFlatTrending(
  userIds: string[],
  slug: HobbySlug,
  since: Date,
): Promise<TrendingItem[]> {
  const rows = await db
    .select({
      externalId: items.externalId,
      title: sql<string>`max(${items.title})`,
      imageUrl: sql<string | null>`max(${items.imageUrl})`,
      year: sql<number | null>`max(${items.year})`,
      combinedRate: sql<number | null>`avg(${items.userRating})`,
      peopleCount: sql<number>`count(*)::int`,
    })
    .from(items)
    .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
    .where(
      and(
        inArray(items.userId, userIds),
        eq(hobbies.slug, slug),
        isNull(items.parentItemId),
        gte(items.updatedAt, since),
        or(isNull(items.status), notInArray(items.status, ["planned", "dropped"])),
      ),
    )
    .groupBy(items.externalId)
    .orderBy(
      sql`coalesce(avg(${items.userRating}), 0) * ln(1 + count(*)) desc, max(${items.updatedAt}) desc`,
    )
    .limit(PER_CATEGORY);

  return rows.map(toItem);
}

/**
 * Top trending TV shows. Unlike flat hobbies, a multi-season show's rating, progress
 * and recency live on its *season* rows, not the show-parent (whose status/rating are
 * null). So we aggregate over the leaf rows — season children and flat single-season
 * shows (both have an ACTIVE status, which also excludes bare parents) — grouped by the
 * show's externalId (the parent's, via the join; the row's own for flat shows). Title
 * and poster come from the show row so cards read as the show, not "Season 3". This
 * also means watching a season bumps that leaf's `updatedAt`, keeping an actively-watched
 * show in the window even if it was added long ago.
 */
async function loadTvTrending(userIds: string[], since: Date): Promise<TrendingItem[]> {
  const showParent = alias(items, "show_parent");
  const showExternalId = sql<string>`coalesce(${showParent.externalId}, ${items.externalId})`;

  const rows = await db
    .select({
      externalId: showExternalId,
      title: sql<string>`max(coalesce(${showParent.title}, ${items.title}))`,
      imageUrl: sql<string | null>`max(coalesce(${showParent.imageUrl}, ${items.imageUrl}))`,
      year: sql<number | null>`max(coalesce(${showParent.year}, ${items.year}))`,
      combinedRate: sql<number | null>`avg(${items.userRating})`,
      peopleCount: sql<number>`count(distinct ${items.userId})::int`,
    })
    .from(items)
    .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
    .leftJoin(showParent, eq(items.parentItemId, showParent.id))
    .where(
      and(
        inArray(items.userId, userIds),
        eq(hobbies.slug, "tv"),
        gte(items.updatedAt, since),
        inArray(items.status, [...ACTIVE_STATUSES]),
      ),
    )
    .groupBy(showExternalId)
    .orderBy(
      sql`coalesce(avg(${items.userRating}), 0) * ln(1 + count(distinct ${items.userId})) desc, max(${items.updatedAt}) desc`,
    )
    .limit(PER_CATEGORY);

  return rows.map(toItem);
}

/** Top trending items per hobby across the given users (active in the last 30 days). */
export async function loadTrending(userIds: string[]): Promise<TrendingByHobby> {
  if (userIds.length === 0) return emptyByHobby();

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const results = await Promise.all(
    HOBBY_SLUGS.map((slug) =>
      slug === "tv" ? loadTvTrending(userIds, since) : loadFlatTrending(userIds, slug, since),
    ),
  );

  const out = emptyByHobby();
  HOBBY_SLUGS.forEach((slug, i) => {
    out[slug] = results[i] ?? [];
  });
  return out;
}

/** Trending among the viewer's accepted friends (plus the viewer when `includeSelf`). */
export async function loadFriendsActivity(
  viewerId: string,
  includeSelf: boolean,
): Promise<TrendingByHobby> {
  try {
    const friendIds = await getAcceptedFriendIds(viewerId);
    const userIds = includeSelf ? [viewerId, ...friendIds] : friendIds;
    return await loadTrending(userIds);
  } catch (err) {
    // Trending is secondary content; never let it take down the page.
    console.error("loadFriendsActivity failed", err);
    return emptyByHobby();
  }
}

/** Trending among a guild's members (excluding the viewer unless `includeSelf`). */
export async function loadGuildActivity(
  guildId: string,
  viewerId: string,
  includeSelf: boolean,
): Promise<TrendingByHobby> {
  try {
    const memberRows = await db
      .select({ userId: guildMembers.userId })
      .from(guildMembers)
      .where(
        includeSelf
          ? eq(guildMembers.guildId, guildId)
          : and(eq(guildMembers.guildId, guildId), ne(guildMembers.userId, viewerId)),
      );

    return await loadTrending(memberRows.map((r) => r.userId));
  } catch (err) {
    console.error("loadGuildActivity failed", err);
    return emptyByHobby();
  }
}
