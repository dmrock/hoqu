import { SITE_URL } from "./site";

/**
 * Origin (scheme + host) of the current request, used to build absolute links
 * for emails. Prefers the platform-set forwarded headers (correct behind
 * Vercel), falls back to the plain `host`, and finally to the canonical
 * SITE_URL when no headers are available.
 */
export function originFrom(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return SITE_URL;
  const proto =
    headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
