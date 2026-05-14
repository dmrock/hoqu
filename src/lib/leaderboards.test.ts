import { describe, expect, it } from "vitest";
import { type LeaderboardRow, metricValue, parseScope, sortLeaderboard } from "./leaderboards";

function row(overrides: Partial<LeaderboardRow> & { id: string }): LeaderboardRow {
  return {
    user: {
      id: overrides.id,
      name: overrides.user?.name ?? null,
      username: overrides.user?.username ?? null,
      image: null,
    },
    totalPoints: overrides.totalPoints ?? 0,
    moviesCompleted: overrides.moviesCompleted ?? 0,
    showsCompleted: overrides.showsCompleted ?? 0,
    gamesCompleted: overrides.gamesCompleted ?? 0,
    booksCompleted: overrides.booksCompleted ?? 0,
  };
}

describe("metricValue", () => {
  const r = row({
    id: "1",
    totalPoints: 50,
    moviesCompleted: 5,
    showsCompleted: 3,
    gamesCompleted: 2,
    booksCompleted: 4,
  });

  it("all → totalPoints", () => {
    expect(metricValue(r, "all")).toBe(50);
  });
  it("movies → moviesCompleted", () => {
    expect(metricValue(r, "movies")).toBe(5);
  });
  it("tv → showsCompleted", () => {
    expect(metricValue(r, "tv")).toBe(3);
  });
  it("games → gamesCompleted", () => {
    expect(metricValue(r, "games")).toBe(2);
  });
  it("books → booksCompleted", () => {
    expect(metricValue(r, "books")).toBe(4);
  });
});

describe("sortLeaderboard", () => {
  it("sorts descending by scope metric", () => {
    const rows = [
      row({
        id: "a",
        totalPoints: 10,
        user: { id: "a", name: "Alice", username: null, image: null },
      }),
      row({
        id: "b",
        totalPoints: 30,
        user: { id: "b", name: "Bob", username: null, image: null },
      }),
      row({
        id: "c",
        totalPoints: 20,
        user: { id: "c", name: "Carol", username: null, image: null },
      }),
    ];
    const sorted = sortLeaderboard(rows, "all");
    expect(sorted.map((r) => r.user.id)).toEqual(["b", "c", "a"]);
  });

  it("tiebreaks alphabetically by name (case-insensitive)", () => {
    const rows = [
      row({
        id: "a",
        totalPoints: 10,
        user: { id: "a", name: "charlie", username: null, image: null },
      }),
      row({
        id: "b",
        totalPoints: 10,
        user: { id: "b", name: "Alice", username: null, image: null },
      }),
      row({
        id: "c",
        totalPoints: 10,
        user: { id: "c", name: "Bob", username: null, image: null },
      }),
    ];
    const sorted = sortLeaderboard(rows, "all");
    expect(sorted.map((r) => r.user.name)).toEqual(["Alice", "Bob", "charlie"]);
  });

  it("falls back to username when name is null", () => {
    const rows = [
      row({
        id: "a",
        totalPoints: 10,
        user: { id: "a", name: null, username: "zed", image: null },
      }),
      row({
        id: "b",
        totalPoints: 10,
        user: { id: "b", name: null, username: "amy", image: null },
      }),
    ];
    const sorted = sortLeaderboard(rows, "all");
    expect(sorted.map((r) => r.user.username)).toEqual(["amy", "zed"]);
  });

  it("does not mutate input array", () => {
    const rows = [row({ id: "a", totalPoints: 1 }), row({ id: "b", totalPoints: 9 })];
    const originalOrder = rows.map((r) => r.user.id);
    sortLeaderboard(rows, "all");
    expect(rows.map((r) => r.user.id)).toEqual(originalOrder);
  });

  it("sorts by scope-specific metric, not totalPoints", () => {
    const rows = [
      row({ id: "a", totalPoints: 999, moviesCompleted: 1 }),
      row({ id: "b", totalPoints: 1, moviesCompleted: 50 }),
    ];
    const sorted = sortLeaderboard(rows, "movies");
    expect(sorted[0]?.user.id).toBe("b");
  });
});

describe("parseScope", () => {
  it("accepts valid hobby slugs", () => {
    expect(parseScope("movies")).toBe("movies");
    expect(parseScope("tv")).toBe("tv");
    expect(parseScope("games")).toBe("games");
    expect(parseScope("books")).toBe("books");
  });

  it("falls back to 'all' for unknown / missing values", () => {
    expect(parseScope(undefined)).toBe("all");
    expect(parseScope("")).toBe("all");
    expect(parseScope("garbage")).toBe("all");
    expect(parseScope("all")).toBe("all");
  });
});
