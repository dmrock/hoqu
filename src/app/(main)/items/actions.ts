"use server";

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type AchievementUnlock, checkAchievements } from "@/lib/achievements";
import { getTvShow, type TvSeason } from "@/lib/api/tmdb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items, users } from "@/lib/db/schema";
import { type CounterDelta, computeCounterDelta, type ItemStatus } from "@/lib/points";
import { checkAddItemLimit } from "@/lib/rate-limit";

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
});

const updateItemSchema = z.object({
  itemId: z.uuid(),
  status: statusSchema,
  userRating: ratingSchema,
  note: noteSchema,
  wouldRevisit: z.boolean(),
});

const deleteItemSchema = z.object({ itemId: z.uuid() });
const refreshShowSchema = z.object({ itemId: z.uuid() });

export type AddItemInput = z.input<typeof addItemSchema>;
export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type ActionResult =
  | { ok: true; unlocks: AchievementUnlock[] }
  | { ok: false; error: string };
export type AddItemResult =
  | { ok: true; unlocks: AchievementUnlock[]; slotsLeft: number }
  | { ok: false; error: string; rateLimited?: boolean };
export type RefreshShowResult =
  | { ok: true; migrated: boolean; unlocks: AchievementUnlock[] }
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
    completedAt,
  };
}

export async function addItem(input: AddItemInput): Promise<AddItemResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.user.id;
  const data = parsed.data;

  const limit = await checkAddItemLimit(userId);
  if (!limit.ok) {
    const minutes = limit.resetAt
      ? Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 60_000))
      : null;
    const error = minutes
      ? `Take a breather — you've hit the add limit. Back in ~${minutes} min.`
      : "Take a breather — you've hit the add limit.";
    return { ok: false, error, rateLimited: true };
  }

  const [hobby] = await db
    .select({ id: hobbies.id })
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
  if (data.hobbySlug === "tv") {
    try {
      const details = await getTvShow(data.externalId);
      seasonCount = Math.max(details.numberOfSeasons, details.seasons.length, 1);
      seasons = details.seasons;
    } catch (err) {
      console.error("getTvShow failed during addItem", err);
      return { ok: false, error: "Could not load show details" };
    }
  }

  const isMultiSeason = data.hobbySlug === "tv" && seasonCount >= 2 && seasons.length >= 2;

  if (!isMultiSeason) {
    const delta = computeCounterDelta({
      oldStatus: null,
      newStatus: data.status,
      oldRating: null,
      newRating: data.userRating,
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
    completedAt: null,
  };

  const sortedSeasons = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  const childRows = sortedSeasons.map((season) => {
    const isFirst = season.seasonNumber === sortedSeasons[0].seasonNumber;
    return seasonRow({
      id: randomUUID(),
      userId,
      hobbyId: hobby.id,
      parentItemId: showId,
      showExternalId: data.externalId,
      showImageUrl: data.imageUrl,
      season,
      status: isFirst ? data.status : "planned",
      userRating: isFirst ? data.userRating : null,
      note: isFirst ? data.note : null,
      wouldRevisit: isFirst ? data.wouldRevisit : false,
    });
  });

  const delta = computeCounterDelta({
    oldStatus: null,
    newStatus: data.status,
    oldRating: null,
    newRating: data.userRating,
    hobbySlug: "tv",
  });

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
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.user.id;
  const data = parsed.data;

  const [existing] = await db
    .select({
      status: items.status,
      userRating: items.userRating,
      hobbyId: items.hobbyId,
      completedAt: items.completedAt,
      parentItemId: items.parentItemId,
      seasonCount: items.seasonCount,
    })
    .from(items)
    .where(and(eq(items.id, data.itemId), eq(items.userId, userId)))
    .limit(1);
  if (!existing) return { ok: false, error: "Item not found" };

  if (existing.parentItemId === null && (existing.seasonCount ?? 1) >= 2) {
    return { ok: false, error: "Edit individual seasons instead" };
  }

  const [hobby] = await db
    .select({ slug: hobbies.slug })
    .from(hobbies)
    .where(eq(hobbies.id, existing.hobbyId))
    .limit(1);
  if (!hobby) return { ok: false, error: "Unknown hobby" };

  const parsedHobby = hobbySlugSchema.safeParse(hobby.slug);
  if (!parsedHobby.success) return { ok: false, error: "Unknown hobby" };

  const delta = computeCounterDelta({
    oldStatus: existing.status,
    newStatus: data.status,
    oldRating: existing.userRating,
    newRating: data.userRating,
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
        updatedAt: new Date(),
      })
      .where(eq(items.id, data.itemId)),
    db.update(users).set(counterUpdateSet(delta)).where(eq(users.id, userId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath(`/${parsedHobby.data}`);
  return { ok: true, unlocks };
}

export async function deleteItem(input: { itemId: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = deleteItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.user.id;
  const { itemId } = parsed.data;

  const [existing] = await db
    .select({
      status: items.status,
      userRating: items.userRating,
      hobbyId: items.hobbyId,
      parentItemId: items.parentItemId,
    })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);
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
    .select({ status: items.status, userRating: items.userRating })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.parentItemId, itemId)));

  const rowsToRemove = [{ status: existing.status, userRating: existing.userRating }, ...children];
  let delta = ZERO_DELTA;
  for (const row of rowsToRemove) {
    delta = addDelta(
      delta,
      computeCounterDelta({
        oldStatus: row.status,
        newStatus: null,
        oldRating: row.userRating,
        newRating: null,
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
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = refreshShowSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.user.id;
  const { itemId } = parsed.data;

  const [existing] = await db
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
    })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);
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
  if (childCount > 0) return { ok: true, migrated: false, unlocks: [] };

  let details: Awaited<ReturnType<typeof getTvShow>>;
  try {
    details = await getTvShow(existing.externalId);
  } catch (err) {
    console.error("getTvShow failed during refreshShow", err);
    return { ok: false, error: "Could not load show details" };
  }

  const fresh = Math.max(details.numberOfSeasons, details.seasons.length, 1);
  if (fresh < 2 || details.seasons.length < 2) {
    if (fresh !== existing.seasonCount) {
      await db.update(items).set({ seasonCount: fresh }).where(eq(items.id, itemId));
    }
    return { ok: true, migrated: false, unlocks: [] };
  }

  const sortedSeasons = [...details.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  const firstSeasonNumber = sortedSeasons[0].seasonNumber;
  const childRows = sortedSeasons.map((season) =>
    seasonRow({
      id: randomUUID(),
      userId,
      hobbyId: existing.hobbyId,
      parentItemId: itemId,
      showExternalId: existing.externalId,
      showImageUrl: existing.imageUrl,
      season,
      status: season.seasonNumber === firstSeasonNumber ? existing.status : "planned",
      userRating: season.seasonNumber === firstSeasonNumber ? existing.userRating : null,
      note: season.seasonNumber === firstSeasonNumber ? existing.note : null,
      wouldRevisit: season.seasonNumber === firstSeasonNumber ? existing.wouldRevisit : false,
    }),
  );

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
        seasonCount: fresh,
        updatedAt: new Date(),
      })
      .where(eq(items.id, itemId)),
  ]);

  const unlocks = await checkAchievements(userId);
  revalidatePath("/tv");
  return { ok: true, migrated: true, unlocks };
}
