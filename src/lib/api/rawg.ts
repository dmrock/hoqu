import type { SearchResult } from "./search";

const RAWG_API_URL = "https://api.rawg.io/api";
const MAX_RESULTS = 8;

type RawgGame = {
  id: number;
  name: string;
  released?: string | null;
  background_image: string | null;
  metacritic?: number | null;
};

type RawgSearchResponse = {
  results: RawgGame[];
};

export async function searchGames(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) throw new Error("RAWG_API_KEY is not set");

  const url = new URL(`${RAWG_API_URL}/games`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", String(MAX_RESULTS));

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`RAWG search failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as RawgSearchResponse;

  return json.results.map((g) => ({
    externalId: String(g.id),
    title: g.name,
    year: g.released ? Number(g.released.slice(0, 4)) || null : null,
    imageUrl: g.background_image ?? null,
    externalRating: typeof g.metacritic === "number" ? g.metacritic : null,
  }));
}
