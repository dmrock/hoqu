import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { addItem } from "@/app/(main)/items/actions";
import { checkAchievements, loadUserCounters } from "@/lib/achievements";
import { db } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser } from "./helpers/db-helpers";

async function unlockedSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: achievements.slug })
    .from(userAchievements)
    .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
    .where(eq(userAchievements.userId, userId));
  return rows.map((r) => r.slug).sort();
}

describe("loadUserCounters", () => {
  it("returns the user counters and a loggedByHobby map", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    // Two completed movies, one planned game (logged but not completed).
    await addItem({
      hobbySlug: "movies",
      externalId: "m1",
      title: "M1",
      imageUrl: null,
      year: 2020,
      externalRating: null,
      status: "completed",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });
    await addItem({
      hobbySlug: "movies",
      externalId: "m2",
      title: "M2",
      imageUrl: null,
      year: 2020,
      externalRating: null,
      status: "completed",
      userRating: 7,
      note: null,
      wouldRevisit: false,
    });
    await addItem({
      hobbySlug: "games",
      externalId: "g1",
      title: "G1",
      imageUrl: null,
      year: 2020,
      externalRating: null,
      status: "planned",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });

    const counters = await loadUserCounters(user.id);
    expect(counters?.moviesCompleted).toBe(2);
    expect(counters?.gamesCompleted).toBe(0);
    expect(counters?.itemsRated).toBe(1);
    expect(counters?.loggedByHobby.movies).toBe(2);
    expect(counters?.loggedByHobby.games).toBe(1);
  });

  it("returns null for an unknown user", async () => {
    const counters = await loadUserCounters("00000000-0000-0000-0000-000000000000");
    expect(counters).toBeNull();
  });
});

describe("checkAchievements", () => {
  it("is idempotent — calling twice does not double-insert unlocks", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem({
      hobbySlug: "movies",
      externalId: "m1",
      title: "M1",
      imageUrl: null,
      year: 2020,
      externalRating: null,
      status: "completed",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });

    // addItem already calls checkAchievements; explicit call shouldn't add more.
    const before = await unlockedSlugs(user.id);
    const newlyOnSecondCall = await checkAchievements(user.id);
    expect(newlyOnSecondCall).toHaveLength(0);
    const after = await unlockedSlugs(user.id);
    expect(after).toEqual(before);
  });
});
