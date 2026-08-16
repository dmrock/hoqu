"use server";

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type AchievementUnlock, checkAchievements } from "@/lib/achievements";
import { getTvShow, type TvSeason, type TvShowDetails } from "@/lib/api/tmdb";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items, users } from "@/lib/db/schema";
import {
  type CounterDelta,
  computeCounterDelta,
  type ItemStatus,
  snapshotPoints,
} from "@/lib/points";
import { checkAddItemLimit } from "@/lib/rate-limit";
import { minutesUntilReset } from "@/lib/rate-limit-format";

const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w342";

const hobbySlugSchema = z.enum(["movies", "tv", "games", "books"]);
const statusSchema = z.enum(["completed", "in_progress", "planned", "dropped"]);
const ratingSchema = z.number().int().min(1).max(10).nullable();
const noteSchema = z.string().max(500).nullable();

const addItemSchema = z.object({
  hobbySlug: hobbySlugSchema,
  externalId: z.string().min(1),
  title: z.string().min(1),
  imageUrl: z.url().nullable(),
  year: z.number().int().nullable(),
  externalRating: z.number().nullable(),
  status: statusSchema,
  userRating: ratingSchema,
  note: noteSchema,
  wouldRevisit: z.boolean().default(false),
  /** TV only: give every season the same status/rating/note instead of just S1. */
  applyToAllSeasons: z.boolean().default(false),
});

const updateItemSchema = z.object({
  itemId: z.uuid(),
  status: statusSchema,
  userRating: ratingSchema,
  note: noteSchema,
  wouldRevisit: z.boolean(),
});

// Every field is optional and "absent means leave it alone" — a show whose
// seasons hold different statuses must not have them flattened just because
// the user wanted to set one rating across the board.
const updateShowSeasonsSchema = z
  .object({
    itemId: z.uuid(),
    status: statusSchema.optional(),
    userRating: ratingSchema.optional(),
    note: noteSchema.optional(),
    wouldRevisit: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      v.userRating !== undefined ||
      v.note !== undefined ||
      v.wouldRevisit !== undefined,
    { message: "Nothing to apply" },
  );

const deleteItemSchema = z.object({ itemId: z.uuid() });
const refreshShowSchema = z.object({ itemId: z.uuid() });
const showSeasonCountSchema = z.object({ externalId: z.string().min(1) });

export type AddItemInput = z.input<typeof addItemSchema>;
export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateShowSeasonsInput = z.input<typeof updateShowSeasonsSchema>;
export type ActionResult =
  | { ok: true; unlocks: AchievementUnlock[] }
  | { ok: false; error: string };
export type AddItemResult =
  | { ok: true; unlocks: AchievementUnlock[]; slotsLeft: number }
  | { ok: false; error: string; rateLimited?: boolean };
export type RefreshShowResult =
  | { ok: true; migrated: boolean; addedSeasons: number; unlocks: AchievementUnlock[] }
  | { ok: false; error: string };
export type ShowSeasonCountResult =
  | { ok: true; seasonCount: number }
  | { ok: false; error: string };

const ZERO_DELTA: CounterDelta = {
  totalPoints: 0,
  moviesCompleted: 0,
  gamesCompleted: 0,
  booksCompleted: 0,
  showsCompleted: 0,
  itemsRated: 0,
};

function addDelta(a: CounterDelta, b: CounterDelta): CounterDelta {
  return {
    totalPoints: a.totalPoints + b.totalPoints,
    moviesCompleted: a.moviesCompleted + b.moviesCompleted,
    gamesCompleted: a.gamesCompleted + b.gamesCompleted,
    booksCompleted: a.booksCompleted + b.booksCompleted,
    showsCompleted: a.showsCompleted + b.showsCompleted,
    itemsRated: a.itemsRated + b.itemsRated,
  };
}

/**
 * Load an item that the user owns. Returns null if the item doesn't exist or
 * belongs to someone else — every caller wants the "not found" UX in both cases
 * (we don't want to confirm existence to a non-owner).
 */
async function loadOwnedItem(userId: string, itemId: string) {
  const [row] = await db
    .select({
      id: items.id,
      hobbyId: items.hobbyId,
      externalId: items.externalId,
      imageUrl: items.imageUrl,
      status: items.status,
      userRating: items.userRating,
      note: items.note,
      wouldRevisit: items.wouldRevisit,
      completedAt: items.completedAt,
      parentItemId: items.parentItemId,
      seasonCount: items.seasonCount,
      pointsAwarded: items.pointsAwarded,
    })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);
  return row ?? null;
}

function counterUpdateSet(delta: CounterDelta) {
  return {
    totalPoints: sql`${users.totalPoints} + ${delta.totalPoints}`,
    moviesCompleted: sql`${users.moviesCompleted} + ${delta.moviesCompleted}`,
    gamesCompleted: sql`${users.gamesCompleted} + ${delta.gamesCompleted}`,
    booksCompleted: sql`${users.booksCompleted} + ${delta.booksCompleted}`,
    showsCompleted: sql`${users.showsCompleted} + ${delta.showsCompleted}`,
    itemsRated: sql`${users.itemsRated} + ${delta.itemsRated}`,
  };
}

/**
 * TMDB sometimes reports a season count without listing the seasons (and vice
 * versa), so both have to clear 2 before we split a show into per-season rows.
 */
function resolveSeasons(details: TvShowDetails): { seasonCount: number; multiSeason: boolean } {
  const seasonCount = Math.max(details.numberOfSeasons, details.seasons.length, 1);
  return { seasonCount, multiSeason: seasonCount >= 2 && details.seasons.length >= 2 };
}

function seasonRow(args: {
  id: string;
  userId: string;
  hobbyId: string;
  parentItemId: string;
  showExternalId: string;
  showImageUrl: string | null;
  season: TvSeason;
  status: ItemStatus | null;
  userRating: number | null;
  note: string | null;
  wouldRevisit: boolean;
  pointsAwarded: number;
}) {
  const seasonImage = args.season.posterPath
    ? `${TMDB_IMAGE_URL}${args.season.posterPath}`
    : args.showImageUrl;
  const year = args.season.airDate ? Number(args.season.airDate.slice(0, 4)) || null : null;
  const completedAt = args.status === "completed" ? new Date() : null;
  return {
    id: args.id,
    userId: args.userId,
    hobbyId: args.hobbyId,
    parentItemId: args.parentItemId,
    seasonNumber: args.season.seasonNumber,
    seasonCount: null,
    externalId: `${args.showExternalId}:s${args.season.seasonNumber}`,
    title: `Season ${args.season.seasonNumber}`,
    imageUrl: seasonImage,
    year,
    externalRating: args.season.voteAverage,
    userRating: args.userRating,
    note: args.note,
    wouldRevisit: args.wouldRevisit,
    status: args.status,
    pointsAwarded: args.pointsAwarded,
    completedAt,
  };
}

export async function addItem(input: AddItemInput): Promise<AddItemResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const data = parsed.data;

  const limit = await checkAddItemLimit(userId);
  if (!limit.ok) {
    const minutes = minutesUntilReset(limit.resetAt);
    const error = minutes
      ? `Take a breather — you've hit the add limit. Back in ~${minutes} min.`
      : "Take a breather — you've hit the add limit.";
    return { ok: false, error, rateLimited: true };
  }

  const [hobby] = await db
    .select({ id: hobbies.id, pointsPerItem: hobbies.pointsPerItem })
    .from(hobbies)
    .where(eq(hobbies.slug, data.hobbySlug))
    .limit(1);
  if (!hobby) return { ok: false, error: "Unknown hobby" };

  const [existing] = await db
    .select({ id: items.id })
    .from(items)
    .where(
      and(
        eq(items.userId, userId),
        eq(items.hobbyId, hobby.id),
        eq(items.externalId, data.externalId),
      ),
    )
    .limit(1);
  if (existing) return { ok: false, error: "Already in your collection" };

  let seasonCount = 1;
  let seasons: TvSeason[] = [];
  let isMultiSeason = false;
  if (data.hobbySlug === "tv") {
    try {
      const details = await getTvShow(data.externalId);
      const resolved = resolveSeasons(details);
      seasonCount = resolved.seasonCount;
      isMultiSeason = resolved.multiSeason;
      seasons = details.seasons;
    } catch (err) {
      console.error("getTvShow failed during addItem", err);
      return { ok: false, error: "Could not load show details" };
    }
  }

  if (!isMultiSeason) {
    const newPointsAwarded = snapshotPoints({
      status: data.status,
      pointsPerItem: hobby.pointsPerItem,
    });
    const delta = computeCounterDelta({
      oldStatus: null,
      newStatus: data.status,
      oldRating: null,
      newRating: data.userRating,
      oldPointsAwarded: 0,
      newPointsAwarded,
      hobbySlug: data.hobbySlug,
    });

    await db.batch([
      db.insert(items).values({
        userId,
        hobbyId: hobby.id,
        externalId: data.externalId,
        title: data.title,
        imageUrl: data.imageUrl,
        year: data.year,
        externalRating: data.externalRating,
        userRating: data.userRating,
        note: data.note,
        wouldRevisit: data.wouldRevisit,
        status: data.status,
        pointsAwarded: newPointsAwarded,
        seasonCount: data.hobbySlug === "tv" ? seasonCount : null,
        completedAt: data.status === "completed" ? new Date() : null,
      }),
      db.update(users).set(counterUpdateSet(delta)).where(eq(users.id, userId)),
    ]);

    const unlocks = await checkAchievements(userId);
    revalidatePath(`/${data.hobbySlug}`);
    return {
      ok: true,
      unlocks,
      slotsLeft: Math.min(limit.hourlyRemaining, limit.dailyRemaining),
    };
  }

  // Multi-season TV: the parent row is non-counting. S1 inherits the user's
  // input and S2..SN start as planned — unless "apply to all seasons" is on,
  // which hands every season the same input so a finished long-running show
  // doesn't have to be rated season by season.
  const showId = randomUUID();
  const showRow = {
    id: showId,
    userId,
    hobbyId: hobby.id,
    parentItemId: null,
    seasonNumber: null,
    seasonCount,
    externalId: data.externalId,
    title: data.title,
    imageUrl: data.imageUrl,
    year: data.year,
    externalRating: data.externalRating,
    userRating: null,
    note: null,
    wouldRevisit: false,
    status: null,
    pointsAwarded: 0,
    completedAt: null,
  };

  const sortedSeasons = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  const childRows = sortedSeasons.map((season) => {
    const inherits =
      data.applyToAllSeasons || season.seasonNumber === sortedSeasons[0].seasonNumber;
    const status = inherits ? data.status : ("planned" as ItemStatus);
    return seasonRow({
      id: randomUUID(),
      userId,
      hobbyId: hobby.id,
      parentItemId: showId,
      showExternalId: data.externalId,
      showImageUrl: data.imageUrl,
      season,
      status,
      userRating: inherits ? data.userRating : null,
      note: inherits ? data.note : null,
      wouldRevisit: inherits ? data.wouldRevisit : false,
      pointsAwarded: snapshotPoints({ status, pointsPerItem: hobby.pointsPerItem }),
    });
  });

  // Each season is its own counting row, so the user delta is the sum over all
  // of them — with "apply to all" off, S2..SN contribute nothing.
  const delta = childRows.reduce(
    (acc, row) =>
      addDelta(
        acc,
        computeCounterDelta({
          oldStatus: null,
          newStatus: row.status,
          oldRating: null,
          newRating: row.userRating,
          oldPointsAwarded: 0,
          newPointsAwarded: row.pointsAwarded,
          hobbySlug: "tv",
        }),
      ),
    ZERO_DELTA,
  );

  await db.batch([
    db.insert(items).values(showRow),
    db.insert(items).values(childRows),
    db.update(users).set(counterUpdateSet(delta)).where(eq(users.id, userId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath(`/${data.hobbySlug}`);
  return {
    ok: true,
    unlocks,
    slotsLeft: Math.min(limit.hourlyRemaining, limit.dailyRemaining),
  };
}

export async function updateItem(input: UpdateItemInput): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const data = parsed.data;

  const existing = await loadOwnedItem(userId, data.itemId);
  if (!existing) return { ok: false, error: "Item not found" };

  if (existing.parentItemId === null && (existing.seasonCount ?? 1) >= 2) {
    return { ok: false, error: "Edit individual seasons instead" };
  }

  const [hobby] = await db
    .select({ slug: hobbies.slug, pointsPerItem: hobbies.pointsPerItem })
    .from(hobbies)
    .where(eq(hobbies.id, existing.hobbyId))
    .limit(1);
  if (!hobby) return { ok: false, error: "Unknown hobby" };

  const parsedHobby = hobbySlugSchema.safeParse(hobby.slug);
  if (!parsedHobby.success) return { ok: false, error: "Unknown hobby" };

  const newPointsAwarded = snapshotPoints({
    status: data.status,
    pointsPerItem: hobby.pointsPerItem,
  });

  const delta = computeCounterDelta({
    oldStatus: existing.status,
    newStatus: data.status,
    oldRating: existing.userRating,
    newRating: data.userRating,
    oldPointsAwarded: existing.pointsAwarded,
    newPointsAwarded,
    hobbySlug: parsedHobby.data,
  });

  const completedAt = data.status === "completed" ? (existing.completedAt ?? new Date()) : null;

  await db.batch([
    db
      .update(items)
      .set({
        status: data.status,
        userRating: data.userRating,
        note: data.note,
        wouldRevisit: data.wouldRevisit,
        completedAt,
        pointsAwarded: newPointsAwarded,
        updatedAt: new Date(),
      })
      .where(eq(items.id, data.itemId)),
    db.update(users).set(counterUpdateSet(delta)).where(eq(users.id, userId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath(`/${parsedHobby.data}`);
  return { ok: true, unlocks };
}

/**
 * Write the same values across every season of a show in one statement. Only
 * the fields present in `input` are touched, so "rate the whole show" doesn't
 * have to also decide a status for seasons the user hasn't watched yet.
 */
export async function updateShowSeasons(input: UpdateShowSeasonsInput): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = updateShowSeasonsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const data = parsed.data;

  const existing = await loadOwnedItem(userId, data.itemId);
  if (!existing) return { ok: false, error: "Item not found" };
  if (existing.parentItemId !== null) {
    return { ok: false, error: "Edit all seasons from the show, not a season" };
  }

  const [hobby] = await db
    .select({ slug: hobbies.slug, pointsPerItem: hobbies.pointsPerItem })
    .from(hobbies)
    .where(eq(hobbies.id, existing.hobbyId))
    .limit(1);
  if (!hobby || hobby.slug !== "tv") return { ok: false, error: "Not a TV show" };

  const children = await db
    .select({
      status: items.status,
      userRating: items.userRating,
      pointsAwarded: items.pointsAwarded,
    })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.parentItemId, data.itemId)));
  if (children.length === 0) return { ok: false, error: "This show has no seasons yet" };

  // Applying a status gives every season the same snapshot, so the write is a
  // single UPDATE; the counter delta still has to be summed per season.
  const newPointsAwarded =
    data.status !== undefined
      ? snapshotPoints({ status: data.status, pointsPerItem: hobby.pointsPerItem })
      : null;

  let delta = ZERO_DELTA;
  for (const child of children) {
    delta = addDelta(
      delta,
      computeCounterDelta({
        oldStatus: child.status,
        newStatus: data.status ?? child.status,
        oldRating: child.userRating,
        newRating: data.userRating !== undefined ? data.userRating : child.userRating,
        oldPointsAwarded: child.pointsAwarded,
        newPointsAwarded: newPointsAwarded ?? child.pointsAwarded,
        hobbySlug: "tv",
      }),
    );
  }

  const set = {
    updatedAt: new Date(),
    ...(data.status !== undefined
      ? {
          status: data.status,
          pointsAwarded: newPointsAwarded ?? 0,
          // coalesce keeps each season's original completion date.
          completedAt:
            data.status === "completed" ? sql`coalesce(${items.completedAt}, now())` : null,
        }
      : {}),
    ...(data.userRating !== undefined ? { userRating: data.userRating } : {}),
    ...(data.note !== undefined ? { note: data.note } : {}),
    ...(data.wouldRevisit !== undefined ? { wouldRevisit: data.wouldRevisit } : {}),
  };

  await db.batch([
    db
      .update(items)
      .set(set)
      .where(and(eq(items.userId, userId), eq(items.parentItemId, data.itemId))),
    db.update(users).set(counterUpdateSet(delta)).where(eq(users.id, userId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath("/tv");
  return { ok: true, unlocks };
}

export async function deleteItem(input: { itemId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = deleteItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const { itemId } = parsed.data;

  const existing = await loadOwnedItem(userId, itemId);
  if (!existing) return { ok: false, error: "Item not found" };

  const [hobby] = await db
    .select({ slug: hobbies.slug })
    .from(hobbies)
    .where(eq(hobbies.id, existing.hobbyId))
    .limit(1);
  if (!hobby) return { ok: false, error: "Unknown hobby" };

  const parsedHobby = hobbySlugSchema.safeParse(hobby.slug);
  if (!parsedHobby.success) return { ok: false, error: "Unknown hobby" };

  const children = await db
    .select({
      status: items.status,
      userRating: items.userRating,
      pointsAwarded: items.pointsAwarded,
    })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.parentItemId, itemId)));

  const rowsToRemove = [
    {
      status: existing.status,
      userRating: existing.userRating,
      pointsAwarded: existing.pointsAwarded,
    },
    ...children,
  ];
  let delta = ZERO_DELTA;
  for (const row of rowsToRemove) {
    delta = addDelta(
      delta,
      computeCounterDelta({
        oldStatus: row.status,
        newStatus: null,
        oldRating: row.userRating,
        newRating: null,
        oldPointsAwarded: row.pointsAwarded,
        newPointsAwarded: 0,
        hobbySlug: parsedHobby.data,
      }),
    );
  }

  await db.batch([
    db.delete(items).where(eq(items.id, itemId)),
    db.update(users).set(counterUpdateSet(delta)).where(eq(users.id, userId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath(`/${parsedHobby.data}`);
  return { ok: true, unlocks };
}

export async function refreshShow(input: { itemId: string }): Promise<RefreshShowResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = refreshShowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const { itemId } = parsed.data;

  const existing = await loadOwnedItem(userId, itemId);
  if (!existing) return { ok: false, error: "Item not found" };
  if (existing.parentItemId !== null) {
    return { ok: false, error: "Refresh from the show, not a season" };
  }

  const [hobby] = await db
    .select({ slug: hobbies.slug })
    .from(hobbies)
    .where(eq(hobbies.id, existing.hobbyId))
    .limit(1);
  if (!hobby || hobby.slug !== "tv") return { ok: false, error: "Not a TV show" };

  const childCount = await db.$count(
    items,
    and(eq(items.userId, userId), eq(items.parentItemId, itemId)),
  );

  let details: Awaited<ReturnType<typeof getTvShow>>;
  try {
    details = await getTvShow(existing.externalId);
  } catch (err) {
    console.error("getTvShow failed during refreshShow", err);
    return { ok: false, error: "Could not load show details" };
  }

  const { seasonCount: fresh, multiSeason } = resolveSeasons(details);

  if (childCount > 0) {
    // Already multi-season: insert seasons TMDB has that we don't. Existing
    // season rows are never touched, and new ones arrive as planned (0 points),
    // so user counters don't move.
    const children = await db
      .select({ externalId: items.externalId })
      .from(items)
      .where(and(eq(items.userId, userId), eq(items.parentItemId, itemId)));
    const tracked = new Set(children.map((c) => c.externalId));
    const newSeasons = details.seasons
      .filter((s) => !tracked.has(`${existing.externalId}:s${s.seasonNumber}`))
      .sort((a, b) => a.seasonNumber - b.seasonNumber);

    if (newSeasons.length === 0) {
      if (fresh !== existing.seasonCount) {
        await db.update(items).set({ seasonCount: fresh }).where(eq(items.id, itemId));
      }
      return { ok: true, migrated: false, addedSeasons: 0, unlocks: [] };
    }

    const newRows = newSeasons.map((season) =>
      seasonRow({
        id: randomUUID(),
        userId,
        hobbyId: existing.hobbyId,
        parentItemId: itemId,
        showExternalId: existing.externalId,
        showImageUrl: existing.imageUrl,
        season,
        status: "planned",
        userRating: null,
        note: null,
        wouldRevisit: false,
        pointsAwarded: 0,
      }),
    );

    await db.batch([
      db.insert(items).values(newRows),
      db
        .update(items)
        .set({ seasonCount: fresh, updatedAt: new Date() })
        .where(eq(items.id, itemId)),
    ]);

    const unlocks = await checkAchievements(userId);
    revalidatePath("/tv");
    return { ok: true, migrated: false, addedSeasons: newRows.length, unlocks };
  }

  if (!multiSeason) {
    if (fresh !== existing.seasonCount) {
      await db.update(items).set({ seasonCount: fresh }).where(eq(items.id, itemId));
    }
    return { ok: true, migrated: false, addedSeasons: 0, unlocks: [] };
  }

  // Migrating flat -> multi-season. S1 inherits the show's exact state INCLUDING
  // its pointsAwarded snapshot, preserving the original completion's value even
  // if hobby.pointsPerItem has been recalibrated since. Net counter delta = 0:
  // show -X (becomes parent), S1 +X (assumes show's old snapshot).
  const sortedSeasons = [...details.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  const firstSeasonNumber = sortedSeasons[0].seasonNumber;
  const childRows = sortedSeasons.map((season) => {
    const isFirst = season.seasonNumber === firstSeasonNumber;
    const status = isFirst ? existing.status : ("planned" as ItemStatus);
    return seasonRow({
      id: randomUUID(),
      userId,
      hobbyId: existing.hobbyId,
      parentItemId: itemId,
      showExternalId: existing.externalId,
      showImageUrl: existing.imageUrl,
      season,
      status,
      userRating: isFirst ? existing.userRating : null,
      note: isFirst ? existing.note : null,
      wouldRevisit: isFirst ? existing.wouldRevisit : false,
      pointsAwarded: isFirst ? existing.pointsAwarded : 0,
    });
  });

  await db.batch([
    db.insert(items).values(childRows),
    db
      .update(items)
      .set({
        status: null,
        userRating: null,
        note: null,
        wouldRevisit: false,
        completedAt: null,
        pointsAwarded: 0,
        seasonCount: fresh,
        updatedAt: new Date(),
      })
      .where(eq(items.id, itemId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath("/tv");
  return { ok: true, migrated: true, addedSeasons: childRows.length, unlocks };
}

/**
 * How many season rows `addItem` would create for a show, so the add dialog can
 * offer "apply to all seasons" with a real number. Returns 1 for anything that
 * stays a flat row — there is nothing to spread a rating across.
 */
export async function getShowSeasonCount(input: {
  externalId: string;
}): Promise<ShowSeasonCountResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = showSeasonCountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  try {
    const details = await getTvShow(parsed.data.externalId);
    const { multiSeason } = resolveSeasons(details);
    return { ok: true, seasonCount: multiSeason ? details.seasons.length : 1 };
  } catch (err) {
    console.error("getTvShow failed during getShowSeasonCount", err);
    return { ok: false, error: "Could not load show details" };
  }
}
