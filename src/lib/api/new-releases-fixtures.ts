import type { SearchResult } from "./search";

/**
 * Test seam for the Explore "new releases" fetchers. The Explore rows are
 * server-rendered from TMDB/IGDB, which Playwright's `page.route` can't
 * intercept, so the e2e webServer sets E2E_NEW_RELEASES_FIXTURES=1 to swap in
 * a deterministic list. Returns null in normal runs — production code paths
 * are untouched.
 */
const ENABLED = process.env.E2E_NEW_RELEASES_FIXTURES === "1";

const MOVIES: SearchResult[] = [
  {
    externalId: "fixture-movie-1",
    title: "Fixture Movie One",
    year: 2026,
    imageUrl: null,
    externalRating: 7.5,
  },
  {
    externalId: "fixture-movie-2",
    title: "Fixture Movie Two",
    year: 2026,
    imageUrl: null,
    externalRating: 8.1,
  },
];

const TV: SearchResult[] = [
  {
    externalId: "fixture-tv-1",
    title: "Fixture Show One",
    year: 2026,
    imageUrl: null,
    externalRating: 8.0,
  },
];

const GAMES: SearchResult[] = [
  {
    externalId: "fixture-game-1",
    title: "Fixture Game One",
    year: 2026,
    imageUrl: null,
    externalRating: 8.5,
  },
];

export function newReleasesFixture(kind: "movies" | "tv" | "games"): SearchResult[] | null {
  if (!ENABLED) return null;
  switch (kind) {
    case "movies":
      return MOVIES;
    case "tv":
      return TV;
    case "games":
      return GAMES;
  }
}
