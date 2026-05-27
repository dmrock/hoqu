import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { searchCollection } from "@/app/(main)/search/actions";
import { db } from "@/lib/db";
import { hobbies, items } from "@/lib/db/schema";
import type { HobbySlug } from "@/lib/points";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser, getHobbyId } from "./helpers/db-helpers";

type InsertItemArgs = {
  userId: string;
  hobbySlug: HobbySlug;
  title: string;
  externalId?: string;
  parentItemId?: string | null;
  seasonNumber?: number | null;
  seasonCount?: number | null;
};

async function insertItem(args: InsertItemArgs): Promise<string> {
  const hobbyId = await getHobbyId(args.hobbySlug);
  const [row] = await db
    .insert(items)
    .values({
      userId: args.userId,
      hobbyId,
      title: args.title,
      externalId: args.externalId ?? `${args.hobbySlug}-${args.title}`,
      parentItemId: args.parentItemId ?? null,
      seasonNumber: args.seasonNumber ?? null,
      seasonCount: args.seasonCount ?? null,
    })
    .returning({ id: items.id });
  if (!row) throw new Error("Failed to insert test item");
  return row.id;
}

describe("searchCollection", () => {
  it("rejects when the auth gate fails", async () => {
    setTestUserId(null);
    const result = await searchCollection("anything");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unauthorized");
  });

  it("returns empty hits when the query is shorter than 2 chars", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    await insertItem({ userId: user.id, hobbySlug: "movies", title: "Inception" });

    const empty = await searchCollection("");
    expect(empty).toEqual({ ok: true, hits: [] });

    const single = await searchCollection("i");
    expect(single).toEqual({ ok: true, hits: [] });
  });

  it("matches case-insensitively on items.title", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    await insertItem({ userId: user.id, hobbySlug: "movies", title: "Inception" });

    const result = await searchCollection("INCE");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]?.title).toBe("Inception");
    expect(result.hits[0]?.hobbySlug).toBe("movies");
  });

  it("does not return another user's items", async () => {
    const owner = await createTestUser({ username: "owner" });
    const stranger = await createTestUser({ username: "stranger" });
    await insertItem({ userId: stranger.id, hobbySlug: "movies", title: "Inception" });

    setTestUserId(owner.id);
    const result = await searchCollection("inception");
    expect(result).toEqual({ ok: true, hits: [] });
  });

  it("excludes per-season rows; only show parents and flat rows are searchable", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const parentId = await insertItem({
      userId: user.id,
      hobbySlug: "tv",
      title: "Breaking Bad",
      seasonCount: 2,
    });
    await insertItem({
      userId: user.id,
      hobbySlug: "tv",
      title: "Breaking Bad — Season 1",
      externalId: "bb-s1",
      parentItemId: parentId,
      seasonNumber: 1,
    });
    await insertItem({
      userId: user.id,
      hobbySlug: "tv",
      title: "Breaking Bad — Season 2",
      externalId: "bb-s2",
      parentItemId: parentId,
      seasonNumber: 2,
    });

    const result = await searchCollection("breaking");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hits.map((h) => h.title)).toEqual(["Breaking Bad"]);
  });

  it("escapes literal % so it doesn't behave as a wildcard", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    await insertItem({ userId: user.id, hobbySlug: "games", title: "Halo" });
    await insertItem({
      userId: user.id,
      hobbySlug: "books",
      title: "100% Pure Adrenaline",
      externalId: "book-1",
    });

    // Without escaping, "100%" would substring-match nothing extra here, but
    // the more telling case is that we don't broaden a typed `%` into a wildcard.
    const result = await searchCollection("100%");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hits.map((h) => h.title)).toEqual(["100% Pure Adrenaline"]);
  });

  it("escapes literal _ so it doesn't match any single char", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    await insertItem({ userId: user.id, hobbySlug: "games", title: "Halo" });
    await insertItem({
      userId: user.id,
      hobbySlug: "games",
      title: "Half-Life",
      externalId: "game-2",
    });

    // "_alf" as a raw LIKE pattern would match "Half"; we expect it not to here.
    const result = await searchCollection("_alf");
    expect(result).toEqual({ ok: true, hits: [] });
  });

  it("orders results by updatedAt descending", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const olderId = await insertItem({
      userId: user.id,
      hobbySlug: "movies",
      title: "Match One",
      externalId: "m-1",
    });
    const newerId = await insertItem({
      userId: user.id,
      hobbySlug: "movies",
      title: "Match Two",
      externalId: "m-2",
    });

    // Force a known ordering: bump `newer` to be the most recent, `older` to be earlier.
    await db
      .update(items)
      .set({ updatedAt: new Date("2026-01-01T00:00:00Z") })
      .where(eq(items.id, olderId));
    await db
      .update(items)
      .set({ updatedAt: new Date("2026-05-01T00:00:00Z") })
      .where(eq(items.id, newerId));

    const result = await searchCollection("match");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hits.map((h) => h.title)).toEqual(["Match Two", "Match One"]);
  });

  it("caps results at 20", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    for (let i = 0; i < 25; i++) {
      await insertItem({
        userId: user.id,
        hobbySlug: "books",
        title: `Saga Volume ${i}`,
        externalId: `saga-${i}`,
      });
    }

    const result = await searchCollection("saga");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.hits).toHaveLength(20);
  });

  it("returns the correct hobbySlug joined from hobbies", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    await insertItem({ userId: user.id, hobbySlug: "books", title: "Dune" });
    await insertItem({
      userId: user.id,
      hobbySlug: "games",
      title: "Dune: Spice Wars",
      externalId: "g-dune",
    });

    const result = await searchCollection("dune");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const slugs = result.hits.map((h) => h.hobbySlug).sort();
    expect(slugs).toEqual(["books", "games"]);
  });
});

// Ensures the hobbies seed exists before the test runs; otherwise getHobbyId throws.
// Smoke test for the seed itself — surfaces config breakage early.
describe("hobbies seed sanity", () => {
  it("has all four hobby slugs", async () => {
    const rows = await db.select({ slug: hobbies.slug }).from(hobbies);
    expect(rows.map((r) => r.slug).sort()).toEqual(["books", "games", "movies", "tv"]);
  });
});
