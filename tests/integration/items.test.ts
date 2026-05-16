import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AddItemInput } from "@/app/(main)/items/actions";
import { addItem, deleteItem, updateItem } from "@/app/(main)/items/actions";
import { db } from "@/lib/db";
import { achievements, items, userAchievements } from "@/lib/db/schema";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser, fetchUser } from "./helpers/db-helpers";

function movieInput(overrides: Partial<AddItemInput> = {}): AddItemInput {
  return {
    hobbySlug: "movies",
    externalId: "27205",
    title: "Inception",
    imageUrl: null,
    year: 2010,
    externalRating: 8.4,
    status: "completed",
    userRating: null,
    note: null,
    wouldRevisit: false,
    ...overrides,
  };
}

async function unlockedSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: achievements.slug })
    .from(userAchievements)
    .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
    .where(eq(userAchievements.userId, userId));
  return rows.map((r) => r.slug).sort();
}

describe("addItem", () => {
  it("creates a completed movie, ticks counters, snapshots points", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const result = await addItem(movieInput());
    expect(result.ok).toBe(true);

    const u = await fetchUser(user.id);
    expect(u?.totalPoints).toBe(1);
    expect(u?.moviesCompleted).toBe(1);

    const rows = await db.select().from(items).where(eq(items.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Inception");
    expect(rows[0]?.pointsAwarded).toBe(1);
    expect(rows[0]?.status).toBe("completed");
  });

  it("ticks itemsRated when adding with a user rating", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem(movieInput({ userRating: 8 }));

    const u = await fetchUser(user.id);
    expect(u?.itemsRated).toBe(1);
  });

  it("does not award points or tick counters for planned status", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem(movieInput({ status: "planned" }));

    const u = await fetchUser(user.id);
    expect(u?.totalPoints).toBe(0);
    expect(u?.moviesCompleted).toBe(0);

    const [row] = await db.select().from(items).where(eq(items.userId, user.id));
    expect(row?.pointsAwarded).toBe(0);
  });

  it("rejects duplicate externalId for the same user+hobby", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const first = await addItem(movieInput());
    expect(first.ok).toBe(true);

    const second = await addItem(movieInput());
    expect(second.ok).toBe(false);
  });

  it("rejects when the auth gate fails (no session set)", async () => {
    setTestUserId(null);
    const result = await addItem(movieInput());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unauthorized/i);
  });

  it("unlocks 'First Step' on the very first completion", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const result = await addItem(movieInput());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unlocks.map((u) => u.slug)).toContain("first_step");

    expect(await unlockedSlugs(user.id)).toContain("first_step");
  });

  it("unlocks 'Movie Buff' on the 5th completed movie", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    for (let i = 1; i <= 5; i++) {
      await addItem(movieInput({ externalId: `movie-${i}`, title: `Movie ${i}` }));
    }

    const slugs = await unlockedSlugs(user.id);
    expect(slugs).toContain("first_step");
    expect(slugs).toContain("movie_buff_5");

    const u = await fetchUser(user.id);
    expect(u?.moviesCompleted).toBe(5);
    expect(u?.totalPoints).toBe(5);
  });
});

describe("updateItem", () => {
  it("rolls counters and points back when moving completed → planned", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const add = await addItem(movieInput());
    if (!add.ok) throw new Error("setup failed");

    const [row] = await db.select().from(items).where(eq(items.userId, user.id));
    if (!row) throw new Error("no item row");

    const result = await updateItem({
      itemId: row.id,
      status: "planned",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });
    expect(result.ok).toBe(true);

    const u = await fetchUser(user.id);
    expect(u?.totalPoints).toBe(0);
    expect(u?.moviesCompleted).toBe(0);

    const [updated] = await db.select().from(items).where(eq(items.id, row.id));
    expect(updated?.pointsAwarded).toBe(0);
    expect(updated?.status).toBe("planned");
  });

  it("re-snapshots points and ticks counters when moving planned → completed", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem(movieInput({ status: "planned" }));
    const [row] = await db.select().from(items).where(eq(items.userId, user.id));
    if (!row) throw new Error("no item row");

    await updateItem({
      itemId: row.id,
      status: "completed",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });

    const u = await fetchUser(user.id);
    expect(u?.totalPoints).toBe(1);
    expect(u?.moviesCompleted).toBe(1);

    const [updated] = await db.select().from(items).where(eq(items.id, row.id));
    expect(updated?.pointsAwarded).toBe(1);
  });

  it("tracks itemsRated independently of status changes", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem(movieInput());
    const [row] = await db.select().from(items).where(eq(items.userId, user.id));
    if (!row) throw new Error("no item row");

    await updateItem({
      itemId: row.id,
      status: "completed",
      userRating: 7,
      note: null,
      wouldRevisit: false,
    });
    expect((await fetchUser(user.id))?.itemsRated).toBe(1);

    await updateItem({
      itemId: row.id,
      status: "completed",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });
    expect((await fetchUser(user.id))?.itemsRated).toBe(0);
  });
});

describe("deleteItem", () => {
  it("removes the item and rolls back counters when it was completed", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem(movieInput());
    const [row] = await db.select().from(items).where(eq(items.userId, user.id));
    if (!row) throw new Error("no item row");

    const result = await deleteItem({ itemId: row.id });
    expect(result.ok).toBe(true);

    const remaining = await db
      .select()
      .from(items)
      .where(and(eq(items.userId, user.id), eq(items.id, row.id)));
    expect(remaining).toHaveLength(0);

    const u = await fetchUser(user.id);
    expect(u?.totalPoints).toBe(0);
    expect(u?.moviesCompleted).toBe(0);
  });
});
