import { newReleasesFixture } from "./new-releases-fixtures";
import type { SearchResult } from "./search";
import { BACKGROUND_TIMEOUT_MS, fetchJson, SEARCH_TIMEOUT_MS } from "./upstream";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w342";
const MAX_RESULTS = 8;

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  vote_average?: number;
};

type TmdbTvShow = {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path: string | null;
  vote_average?: number;
};

function tmdbSearchUrl(path: "movie" | "tv", query: string, apiKey: string): URL {
  const url = new URL(`${TMDB_API_URL}/search/${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");
  return url;
}

function toMovieResult(m: TmdbMovie): SearchResult {
  return {
    externalId: String(m.id),
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) || null : null,
    imageUrl: m.poster_path ? `${TMDB_IMAGE_URL}${m.poster_path}` : null,
    externalRating: typeof m.vote_average === "number" ? m.vote_average : null,
  };
}

function toTvResult(t: TmdbTvShow): SearchResult {
  return {
    externalId: String(t.id),
    title: t.name,
    year: t.first_air_date ? Number(t.first_air_date.slice(0, 4)) || null : null,
    imageUrl: t.poster_path ? `${TMDB_IMAGE_URL}${t.poster_path}` : null,
    externalRating: typeof t.vote_average === "number" ? t.vote_average : null,
  };
}

export async function searchMovies(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const json = await fetchJson<{ results: TmdbMovie[] }>(tmdbSearchUrl("movie", query, apiKey), {
    provider: "TMDB",
    timeoutMs: SEARCH_TIMEOUT_MS,
  });
  return json.results.slice(0, MAX_RESULTS).map(toMovieResult);
}

export async function getNowPlayingMovies(): Promise<SearchResult[]> {
  const fixture = newReleasesFixture("movies");
  if (fixture) return fixture;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${TMDB_API_URL}/movie/now_playing`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const json = await fetchJson<{ results: TmdbMovie[] }>(url, {
    provider: "TMDB",
    timeoutMs: BACKGROUND_TIMEOUT_MS,
    next: { revalidate: 3600 },
  });
  return json.results.slice(0, MAX_RESULTS).map(toMovieResult);
}

export async function getOnTheAirTvShows(): Promise<SearchResult[]> {
  const fixture = newReleasesFixture("tv");
  if (fixture) return fixture;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${TMDB_API_URL}/tv/on_the_air`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const json = await fetchJson<{ results: TmdbTvShow[] }>(url, {
    provider: "TMDB",
    timeoutMs: BACKGROUND_TIMEOUT_MS,
    next: { revalidate: 3600 },
  });
  return json.results.slice(0, MAX_RESULTS).map(toTvResult);
}

export type TvSeason = {
  seasonNumber: number;
  name: string;
  airDate: string | null;
  posterPath: string | null;
  voteAverage: number | null;
};

export type TvShowDetails = {
  numberOfSeasons: number;
  seasons: TvSeason[];
};

export async function getTvShow(externalId: string): Promise<TvShowDetails> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${TMDB_API_URL}/tv/${encodeURIComponent(externalId)}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");

  const json = await fetchJson<{
    number_of_seasons?: number;
    seasons?: Array<{
      season_number: number;
      name: string;
      air_date: string | null;
      poster_path: string | null;
      vote_average?: number;
    }>;
  }>(url, { provider: "TMDB", timeoutMs: SEARCH_TIMEOUT_MS });

  const seasons = (json.seasons ?? [])
    .filter((s) => s.season_number >= 1)
    .map((s) => ({
      seasonNumber: s.season_number,
      name: s.name,
      airDate: s.air_date,
      posterPath: s.poster_path,
      voteAverage: typeof s.vote_average === "number" && s.vote_average > 0 ? s.vote_average : null,
    }));

  return {
    numberOfSeasons: json.number_of_seasons ?? seasons.length,
    seasons,
  };
}

export async function searchTvShows(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const json = await fetchJson<{ results: TmdbTvShow[] }>(tmdbSearchUrl("tv", query, apiKey), {
    provider: "TMDB",
    timeoutMs: SEARCH_TIMEOUT_MS,
  });
  return json.results.slice(0, MAX_RESULTS).map(toTvResult);
}
