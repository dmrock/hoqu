import type { HobbySlug } from "./points";

export type LeaderboardScope = "all" | HobbySlug;

export const SCOPE_OPTIONS: { value: LeaderboardScope; label: string; metric: string }[] = [
  { value: "all", label: "All", metric: "Total points" },
  { value: "movies", label: "Movies", metric: "Movies completed" },
  { value: "tv", label: "TV Shows", metric: "Seasons completed" },
  { value: "games", label: "Games", metric: "Games completed" },
  { value: "books", label: "Books", metric: "Books completed" },
];

export type LeaderboardRow = {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  totalPoints: number;
  moviesCompleted: number;
  showsCompleted: number;
  gamesCompleted: number;
  booksCompleted: number;
};

export function metricValue(row: LeaderboardRow, scope: LeaderboardScope): number {
  switch (scope) {
    case "movies":
      return row.moviesCompleted;
    case "tv":
      return row.showsCompleted;
    case "games":
      return row.gamesCompleted;
    case "books":
      return row.booksCompleted;
    default:
      return row.totalPoints;
  }
}

/** Sort descending by the scope's metric, with stable name tiebreak. */
export function sortLeaderboard(rows: LeaderboardRow[], scope: LeaderboardScope): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const diff = metricValue(b, scope) - metricValue(a, scope);
    if (diff !== 0) return diff;
    const an = (a.user.name ?? a.user.username ?? "").toLowerCase();
    const bn = (b.user.name ?? b.user.username ?? "").toLowerCase();
    return an.localeCompare(bn);
  });
}

export function parseScope(value: string | undefined): LeaderboardScope {
  if (value === "movies" || value === "tv" || value === "games" || value === "books") {
    return value;
  }
  return "all";
}
