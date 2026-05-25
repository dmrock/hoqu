import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Next.js evaluates route modules at build time to collect page data, and
// the Auth.js Drizzle adapter introspects this `db` value at module load
// (using instanceof checks that Proxies break). On Vercel Preview builds
// DATABASE_URL is intentionally unset, so we substitute a placeholder URL
// at build time only. Drizzle/Neon stores the URL lazily — no connection
// happens unless a query runs. If a query *does* run with the placeholder,
// the Neon HTTP fetch fails loudly with a connection error, which is the
// correct behavior for a misconfigured runtime.
const PLACEHOLDER_DATABASE_URL = "postgres://placeholder@placeholder.invalid/placeholder";
const url = process.env.DATABASE_URL ?? PLACEHOLDER_DATABASE_URL;
if (url === PLACEHOLDER_DATABASE_URL) {
  console.warn("DATABASE_URL not set — using placeholder; any DB query will fail.");
}

export const db = drizzle(url, { schema });
export { schema };
