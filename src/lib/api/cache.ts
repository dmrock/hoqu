import { redis } from "@/lib/redis";

const SEARCH_TTL_SECONDS = 15 * 60;

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/**
 * Wraps a search fetcher with Upstash Redis caching keyed by hobby + normalized
 * query. Cache failures never block the request — on a Redis miss/error we just
 * fall through to the underlying fetch.
 */
export async function cachedSearch<T>(
  hobby: string,
  query: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const key = `search:${hobby}:${normalizeQuery(query)}`;

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) return cached;
  } catch (err) {
    console.error(`redis cache read failed for ${key}`, err);
  }

  const value = await fetcher();

  redis.set(key, value, { ex: SEARCH_TTL_SECONDS }).catch((err) => {
    console.error(`redis cache write failed for ${key}`, err);
  });

  return value;
}
