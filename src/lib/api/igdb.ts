import { getIgdbAccessToken, igdbClientId, invalidateIgdbToken } from "./igdb-token";
import { newReleasesFixture } from "./new-releases-fixtures";
import type { SearchResult } from "./search";
import {
  BACKGROUND_TIMEOUT_MS,
  fetchJson,
  SEARCH_TIMEOUT_MS,
  UpstreamResponseError,
} from "./upstream";

const IGDB_API_URL = "https://api.igdb.com/v4";
const IGDB_IMAGE_URL = "https://images.igdb.com/igdb/image/upload";
const MAX_RESULTS = 8;
const FIELDS = "fields name,cover.image_id,first_release_date,total_rating;";

const RECENT_WINDOW_SECONDS = 90 * 24 * 60 * 60;

type IgdbGame = {
  id: number;
  name: string;
  first_release_date?: number;
  cover?: { image_id?: string };
  total_rating?: number;
};

function toGameResult(g: IgdbGame): SearchResult {
  return {
    externalId: String(g.id),
    title: g.name,
    // IGDB dates are unix seconds, unlike TMDB's "YYYY-MM-DD" strings.
    year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
    imageUrl: g.cover?.image_id ? `${IGDB_IMAGE_URL}/t_cover_big/${g.cover.image_id}.jpg` : null,
    // `total_rating` blends critic and user scores into a 0-100 float. Round it:
    // the column is a display snapshot, and game scores read as whole numbers.
    externalRating: typeof g.total_rating === "number" ? Math.round(g.total_rating) : null,
  };
}

/**
 * The query is interpolated into a double-quoted Apicalypse string, so an
 * unescaped quote in user input would terminate it and let the rest of the term
 * be read as query syntax. Escape the two characters that can break out.
 */
function quoteSearchTerm(query: string): string {
  return query.replace(/[\\"]/g, "\\$&").replace(/[\r\n]+/g, " ");
}

type IgdbQueryOptions = {
  timeoutMs: number;
  cache?: RequestCache;
  next?: { revalidate: number };
};

async function igdbQuery(body: string, opts: IgdbQueryOptions): Promise<IgdbGame[]> {
  const run = (token: string) =>
    fetchJson<IgdbGame[]>(`${IGDB_API_URL}/games`, {
      provider: "IGDB",
      method: "POST",
      body,
      headers: { "Client-ID": igdbClientId(), Authorization: `Bearer ${token}` },
      ...opts,
    });

  try {
    return await run(await getIgdbAccessToken());
  } catch (err) {
    // A rotated secret kills outstanding tokens before their recorded expiry.
    // Re-authenticate once rather than failing every search until the TTL runs out.
    if (err instanceof UpstreamResponseError && err.status === 401) {
      await invalidateIgdbToken();
      return run(await getIgdbAccessToken());
    }
    throw err;
  }
}

export async function searchGames(query: string): Promise<SearchResult[]> {
  // `version_parent = null` drops editions and re-releases ("Collector's
  // Edition") that would otherwise crowd out the base game.
  const body =
    `search "${quoteSearchTerm(query)}"; ${FIELDS} ` +
    `where version_parent = null; limit ${MAX_RESULTS};`;

  const games = await igdbQuery(body, { timeoutMs: SEARCH_TIMEOUT_MS });
  return games.map(toGameResult);
}

export async function getRecentGames(): Promise<SearchResult[]> {
  const fixture = newReleasesFixture("games");
  if (fixture) return fixture;

  const now = Math.floor(Date.now() / 1000);
  const since = now - RECENT_WINDOW_SECONDS;

  // Popularity proxy: how many people have rated it at all. Keeps unrated
  // shovelware out of the row without narrowing the recency window.
  const body =
    `${FIELDS} where first_release_date >= ${since} & first_release_date <= ${now} ` +
    `& version_parent = null & total_rating_count != null; ` +
    `sort total_rating_count desc; limit ${MAX_RESULTS};`;

  const games = await igdbQuery(body, {
    timeoutMs: BACKGROUND_TIMEOUT_MS,
    // Next only caches POSTs (and Authorization-bearing requests) when asked to.
    cache: "force-cache",
    next: { revalidate: 3600 },
  });
  return games.map(toGameResult);
}
