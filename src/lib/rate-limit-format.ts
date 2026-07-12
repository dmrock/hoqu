/**
 * Whole minutes until `resetAt` (epoch ms), floored at 1 so UI copy never says
 * "~0 min". Null in, null out — a fail-open limiter reports no reset time.
 * Pure (no Redis import) so client-adjacent code and unit tests can use it
 * without pulling in the limiter module.
 */
export function minutesUntilReset(resetAt: number | null, now: number = Date.now()): number | null {
  if (resetAt === null) return null;
  return Math.max(1, Math.ceil((resetAt - now) / 60_000));
}
