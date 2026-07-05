import { describe, expect, it, vi } from "vitest";
import type { AddItemInput } from "@/app/(main)/items/actions";
import { addItem } from "@/app/(main)/items/actions";
import { exportDataAction } from "@/app/(main)/settings/actions";
import { getTvShow, type TvShowDetails } from "@/lib/api/tmdb";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser } from "./helpers/db-helpers";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function movieInput(overrides: Partial<AddItemInput> = {}): AddItemInput {
  return {
    hobbySlug: "movies",
    externalId: "27205",
    title: "Inception",
    imageUrl: null,
    year: 2010,
    externalRating: 8.4,
    status: "completed",
    userRating: 9,
    note: 'Mind-bending, "rewatch it"',
    wouldRevisit: true,
    ...overrides,
  };
}

function tvDetails(seasonCount: number): TvShowDetails {
  return {
    numberOfSeasons: seasonCount,
    seasons: Array.from({ length: seasonCount }, (_, i) => ({
      seasonNumber: i + 1,
      name: `Season ${i + 1}`,
      airDate: `${2020 + i}-01-01`,
      posterPath: null,
      voteAverage: null,
    })),
  };
}

describe("exportDataAction", () => {
  it("rejects when the auth gate fails (no session set)", async () => {
    setTestUserId(null);
    const result = await exportDataAction();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unauthorized/i);
  });

  it("exports all items (incl. season rows), profile stats and achievements", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    await addItem(movieInput());
    await addItem({
      hobbySlug: "games",
      externalId: "3498",
      title: "Backlog Game",
      imageUrl: null,
      year: 2013,
      externalRating: null,
      status: "planned",
      userRating: null,
      note: null,
      wouldRevisit: false,
    });
    vi.mocked(getTvShow).mockResolvedValue(tvDetails(2));
    await addItem({
      hobbySlug: "tv",
      externalId: "500",
      title: "Ongoing Show",
      imageUrl: null,
      year: 2020,
      externalRating: 8.2,
      status: "completed",
      userRating: 8,
      note: null,
      wouldRevisit: false,
    });

    const result = await exportDataAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { data } = result;

    expect(data.exportedAt).toMatch(ISO_DATE);

    // movie + game + show parent + 2 season rows
    expect(data.items).toHaveLength(5);

    const movie = data.items.find((i) => i.externalId === "27205");
    expect(movie).toMatchObject({
      title: "Inception",
      hobby: "movies",
      status: "completed",
      userRating: 9,
      note: 'Mind-bending, "rewatch it"',
      wouldRevisit: true,
      year: 2010,
      seasonNumber: null,
      seasonCount: null,
      parentExternalId: null,
      parentTitle: null,
    });
    expect(movie?.completedAt).toMatch(ISO_DATE);
    expect(movie?.createdAt).toMatch(ISO_DATE);

    const game = data.items.find((i) => i.externalId === "3498");
    expect(game).toMatchObject({ hobby: "games", status: "planned", completedAt: null });

    const show = data.items.find((i) => i.externalId === "500");
    expect(show).toMatchObject({
      title: "Ongoing Show",
      hobby: "tv",
      status: null,
      seasonNumber: null,
      seasonCount: 2,
      parentExternalId: null,
      parentTitle: null,
    });

    const s1 = data.items.find((i) => i.externalId === "500:s1");
    expect(s1).toMatchObject({
      title: "Season 1",
      hobby: "tv",
      status: "completed",
      userRating: 8,
      seasonNumber: 1,
      parentExternalId: "500",
      parentTitle: "Ongoing Show",
    });
    expect(s1?.completedAt).toMatch(ISO_DATE);

    const s2 = data.items.find((i) => i.externalId === "500:s2");
    expect(s2).toMatchObject({
      status: "planned",
      seasonNumber: 2,
      parentExternalId: "500",
      parentTitle: "Ongoing Show",
    });

    // movie (1 pt) + completed S1 (5 pts); movie and S1 both rated
    expect(data.profile).toMatchObject({
      username: user.username,
      totalPoints: 6,
      moviesCompleted: 1,
      showsCompleted: 1,
      gamesCompleted: 0,
      booksCompleted: 0,
      itemsRated: 2,
    });

    expect(data.achievements.map((a) => a.slug)).toContain("first_step");
    for (const achievement of data.achievements) {
      expect(achievement.unlockedAt).toMatch(ISO_DATE);
    }
  });

  it("only exports the signed-in user's data", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    setTestUserId(alice.id);
    await addItem(movieInput());

    setTestUserId(bob.id);
    const result = await exportDataAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.achievements).toHaveLength(0);
    expect(result.data.profile.username).toBe(bob.username);
  });
});
