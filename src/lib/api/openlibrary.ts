import type { SearchResult } from "./search";

const OPEN_LIBRARY_URL = "https://openlibrary.org/search.json";
const COVER_URL = "https://covers.openlibrary.org/b/id";
const USER_AGENT = "HOQU/0.1 (hoqu.dev; contact: hello@hoqu.dev)";
const MAX_RESULTS = 8;

type OpenLibraryDoc = {
  key: string;
  title?: string;
  first_publish_year?: number;
  cover_i?: number;
};

type OpenLibraryResponse = {
  docs: OpenLibraryDoc[];
};

function toBookResult(d: OpenLibraryDoc): SearchResult | null {
  if (!d.title) return null;
  return {
    externalId: d.key,
    title: d.title,
    year: d.first_publish_year ?? null,
    imageUrl: d.cover_i ? `${COVER_URL}/${d.cover_i}-M.jpg` : null,
    externalRating: null,
  };
}

export async function searchBooks(query: string): Promise<SearchResult[]> {
  const url = new URL(OPEN_LIBRARY_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(MAX_RESULTS));
  url.searchParams.set("fields", "key,title,first_publish_year,cover_i");

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Open Library search failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as OpenLibraryResponse;
  return json.docs.map(toBookResult).filter((r): r is SearchResult => r !== null);
}
