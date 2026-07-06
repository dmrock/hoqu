import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { hobbies, items, users } from "../../src/lib/db/schema";
import type { ItemStatus } from "../../src/lib/points";

async function requireUserId(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) throw new Error(`user ${email} not found in DB`);
  return user.id;
}

async function requireHobbyId(slug: string) {
  const [hobby] = await db
    .select({ id: hobbies.id })
    .from(hobbies)
    .where(eq(hobbies.slug, slug))
    .limit(1);
  if (!hobby) throw new Error(`hobby ${slug} not seeded`);
  return hobby.id;
}

type SeedItemOptions = {
  email: string;
  hobbySlug: string;
  title: string;
  externalId: string;
  year?: number;
  status?: ItemStatus;
};

/**
 * Insert an item directly for a user, bypassing the add flow. Idempotent
 * (`onConflictDoNothing`) so retries don't trip the (user, hobby, external_id)
 * unique index. Pass an explicit `status` — the hobby page filters on
 * `status IN (...)`, so a status-less row never renders.
 */
export async function seedItem(opts: SeedItemOptions) {
  const [userId, hobbyId] = await Promise.all([
    requireUserId(opts.email),
    requireHobbyId(opts.hobbySlug),
  ]);
  await db
    .insert(items)
    .values({
      userId,
      hobbyId,
      title: opts.title,
      externalId: opts.externalId,
      year: opts.year,
      status: opts.status ?? "completed",
    })
    .onConflictDoNothing();
}

export async function deleteSeededItem(email: string, externalId: string) {
  const userId = await requireUserId(email);
  await db.delete(items).where(and(eq(items.userId, userId), eq(items.externalId, externalId)));
}

type SeedManyOptions = {
  email: string;
  hobbySlug: string;
  /** One row per entry; `externalId` doubles as the conflict key on retries. */
  rows: { title: string; externalId: string; year?: number; status?: ItemStatus }[];
};

/**
 * Bulk variant of `seedItem` for specs that need a big collection (pagination):
 * one user/hobby lookup + one multi-row insert instead of N round trips.
 * Returns ids keyed by externalId (rows skipped by `onConflictDoNothing`
 * are re-read so the map is complete either way).
 */
export async function seedItems(opts: SeedManyOptions): Promise<Map<string, string>> {
  const [userId, hobbyId] = await Promise.all([
    requireUserId(opts.email),
    requireHobbyId(opts.hobbySlug),
  ]);
  await db
    .insert(items)
    .values(
      opts.rows.map((r) => ({
        userId,
        hobbyId,
        title: r.title,
        externalId: r.externalId,
        year: r.year,
        status: r.status ?? "completed",
      })),
    )
    .onConflictDoNothing();

  const inserted = await db
    .select({ id: items.id, externalId: items.externalId })
    .from(items)
    .where(
      and(
        eq(items.userId, userId),
        inArray(
          items.externalId,
          opts.rows.map((r) => r.externalId),
        ),
      ),
    );
  return new Map(inserted.map((r) => [r.externalId, r.id]));
}

export async function deleteSeededItems(email: string, externalIds: string[]) {
  if (externalIds.length === 0) return;
  const userId = await requireUserId(email);
  await db
    .delete(items)
    .where(and(eq(items.userId, userId), inArray(items.externalId, externalIds)));
}
