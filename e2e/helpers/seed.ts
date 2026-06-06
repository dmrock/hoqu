import { and, eq } from "drizzle-orm";
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
