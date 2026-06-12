/**
 * Best-effort client IP for rate-limit keying. On Vercel `x-forwarded-for` is
 * platform-set and its first hop is the real client. Returns "unknown" rather
 * than throwing when neither header is present — callers use this for
 * anti-abuse buckets, where a shared fallback bucket beats a crash.
 */
export function clientIpFrom(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedFor) return forwardedFor;
  return headers.get("x-real-ip")?.trim() || "unknown";
}
