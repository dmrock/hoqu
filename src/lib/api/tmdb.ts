import type { SearchResult } from "./search";

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

type TmdbSearchResponse = {
  results: TmdbMovie[];
};

export async function searchMovies(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${TMDB_API_URL}/search/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as TmdbSearchResponse;

  return json.results.slice(0, MAX_RESULTS).map((m) => ({
    externalId: String(m.id),
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) || null : null,
    imageUrl: m.poster_path ? `${TMDB_IMAGE_URL}${m.poster_path}` : null,
    externalRating: typeof m.vote_average === "number" ? m.vote_average : null,
  }));
}
