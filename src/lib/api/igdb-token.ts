import { redis } from "@/lib/redis";
import { fetchJson, SEARCH_TIMEOUT_MS } from "./upstream";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const REDIS_KEY = "igdb:access-token";

/**
 * Retire the token early so a request can't pick one up moments before it
 * expires and fail mid-flight.
 */
const EXPIRY_MARGIN_SECONDS = 300;

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CachedToken = { token: string; expiresAt: number };

/**
 * Process-local copy so a warm serverless instance skips the Redis round trip.
 * Redis remains the shared source of truth across instances.
 */
let memo: CachedToken | null = null;

export function igdbClientId(): string {
  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId) throw new Error("IGDB_CLIENT_ID is not set");
  return clientId;
}

async function requestToken(): Promise<CachedToken> {
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientSecret) throw new Error("IGDB_CLIENT_SECRET is not set");

  const url = new URL(TWITCH_TOKEN_URL);
  url.searchParams.set("client_id", igdbClientId());
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const json = await fetchJson<TwitchTokenResponse>(url, {
    provider: "Twitch",
    timeoutMs: SEARCH_TIMEOUT_MS,
    method: "POST",
  });

  // Lifetime is whatever Twitch says — observed ~56 days, but their docs show a
  // different figure, so never assume a fixed window.
  const lifetime = Math.max(json.expires_in - EXPIRY_MARGIN_SECONDS, 0);
  return { token: json.access_token, expiresAt: Date.now() + lifetime * 1000 };
}

/**
 * Client-credentials bearer token for IGDB, cached in Redis for its full
 * lifetime. Redis failures are logged and ignored: the cost is an extra token
 * request, not a broken search — the same fail-open posture as the search cache.
 */
export async function getIgdbAccessToken(): Promise<string> {
  const now = Date.now();
  if (memo && memo.expiresAt > now) return memo.token;

  try {
    const cached = await redis.get<CachedToken>(REDIS_KEY);
    if (cached?.token && cached.expiresAt > now) {
      memo = cached;
      return cached.token;
    }
  } catch (err) {
    console.error("igdb token cache read failed", err);
  }

  const fresh = await requestToken();
  memo = fresh;

  const ttlSeconds = Math.floor((fresh.expiresAt - now) / 1000);
  if (ttlSeconds > 0) {
    redis.set(REDIS_KEY, fresh, { ex: ttlSeconds }).catch((err) => {
      console.error("igdb token cache write failed", err);
    });
  }

  return fresh.token;
}

/**
 * Drop the cached token. Rotating the client secret in the Twitch console
 * invalidates outstanding tokens immediately, so a 401 means the cached value
 * is dead well before its recorded expiry.
 */
export async function invalidateIgdbToken(): Promise<void> {
  memo = null;
  try {
    await redis.del(REDIS_KEY);
  } catch (err) {
    console.error("igdb token cache delete failed", err);
  }
}
