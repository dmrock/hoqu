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

function toGameResult(g: RawgGame): SearchResult {
  return {
    externalId: String(g.id),
    title: g.name,
    year: g.released ? Number(g.released.slice(0, 4)) || null : null,
    imageUrl: g.background_image ?? null,
    externalRating: typeof g.metacritic === "number" ? g.metacritic : null,
  };
}

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
  return json.results.map(toGameResult);
}

export async function getRecentGames(): Promise<SearchResult[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) throw new Error("RAWG_API_KEY is not set");

  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - 90);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url = new URL(`${RAWG_API_URL}/games`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("dates", `${fmt(past)},${fmt(today)}`);
  // Popularity proxy: number of RAWG users who have logged the game.
  // Keeps the date window so results stay "recent" while filtering noise.
  url.searchParams.set("ordering", "-added");
  url.searchParams.set("page_size", String(MAX_RESULTS));

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`RAWG recent failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as RawgSearchResponse;
  return json.results.map(toGameResult);
}
