"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items, users } from "@/lib/db/schema";
import { computeCounterDelta } from "@/lib/points";

const hobbySlugSchema = z.enum(["movies", "games", "books"]);
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

export type AddItemInput = z.input<typeof addItemSchema>;
export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addItem(input: AddItemInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.user.id;
  const data = parsed.data;

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
      completedAt: data.status === "completed" ? new Date() : null,
    }),
    db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${delta.totalPoints}`,
        moviesCompleted: sql`${users.moviesCompleted} + ${delta.moviesCompleted}`,
        gamesCompleted: sql`${users.gamesCompleted} + ${delta.gamesCompleted}`,
        booksCompleted: sql`${users.booksCompleted} + ${delta.booksCompleted}`,
        itemsRated: sql`${users.itemsRated} + ${delta.itemsRated}`,
      })
      .where(eq(users.id, userId)),
  ]);

  revalidatePath(`/${data.hobbySlug}`);
  return { ok: true };
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
    })
    .from(items)
    .where(and(eq(items.id, data.itemId), eq(items.userId, userId)))
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
    db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${delta.totalPoints}`,
        moviesCompleted: sql`${users.moviesCompleted} + ${delta.moviesCompleted}`,
        gamesCompleted: sql`${users.gamesCompleted} + ${delta.gamesCompleted}`,
        booksCompleted: sql`${users.booksCompleted} + ${delta.booksCompleted}`,
        itemsRated: sql`${users.itemsRated} + ${delta.itemsRated}`,
      })
      .where(eq(users.id, userId)),
  ]);

  revalidatePath(`/${parsedHobby.data}`);
  return { ok: true };
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

  const delta = computeCounterDelta({
    oldStatus: existing.status,
    newStatus: null,
    oldRating: existing.userRating,
    newRating: null,
    hobbySlug: parsedHobby.data,
  });

  await db.batch([
    db.delete(items).where(eq(items.id, itemId)),
    db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${delta.totalPoints}`,
        moviesCompleted: sql`${users.moviesCompleted} + ${delta.moviesCompleted}`,
        gamesCompleted: sql`${users.gamesCompleted} + ${delta.gamesCompleted}`,
        booksCompleted: sql`${users.booksCompleted} + ${delta.booksCompleted}`,
        itemsRated: sql`${users.itemsRated} + ${delta.itemsRated}`,
      })
      .where(eq(users.id, userId)),
  ]);

  revalidatePath(`/${parsedHobby.data}`);
  return { ok: true };
}
