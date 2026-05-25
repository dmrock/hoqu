import { Redis } from "@upstash/redis";

// Vercel Preview env scope is intentionally blank; Next.js evaluates route
// modules during build to collect page data and would otherwise crash here.
// Substitute placeholder credentials so the client constructs at build time —
// any actual call against the placeholder fails loudly with an HTTP error,
// which is the correct behavior for a misconfigured runtime. See the
// matching pattern in src/lib/db/index.ts.
const PLACEHOLDER_URL = "https://placeholder.upstash.invalid";
const PLACEHOLDER_TOKEN = "placeholder";

const url = process.env.UPSTASH_REDIS_REST_URL ?? PLACEHOLDER_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? PLACEHOLDER_TOKEN;
if (url === PLACEHOLDER_URL || token === PLACEHOLDER_TOKEN) {
  console.warn("Upstash Redis credentials missing — using placeholders; any Redis call will fail.");
}

export const redis = new Redis({ url, token });
