import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

const HOURLY_LIMIT = 50;
const DAILY_LIMIT = 200;

const addItemHourly = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(HOURLY_LIMIT, "1 h"),
  prefix: "ratelimit:add-item:hourly",
  analytics: false,
});

const addItemDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(DAILY_LIMIT, "1 d"),
  prefix: "ratelimit:add-item:daily",
  analytics: false,
});

export type AddItemLimitResult = {
  ok: boolean;
  hourlyRemaining: number;
  dailyRemaining: number;
  /** Epoch ms when the most-restrictive bucket resets (only meaningful when ok=false). */
  resetAt: number | null;
};

/**
 * Apply both the hourly and daily windows for a given user. Both buckets are
 * consumed in parallel — if Redis is unavailable, we fail open (allow the
 * request) since these limits are anti-spam, not security.
 */
export async function checkAddItemLimit(userId: string): Promise<AddItemLimitResult> {
  try {
    const [hourly, daily] = await Promise.all([
      addItemHourly.limit(userId),
      addItemDaily.limit(userId),
    ]);
    const ok = hourly.success && daily.success;
    let resetAt: number | null = null;
    if (!hourly.success && !daily.success) resetAt = Math.min(hourly.reset, daily.reset);
    else if (!hourly.success) resetAt = hourly.reset;
    else if (!daily.success) resetAt = daily.reset;
    return {
      ok,
      hourlyRemaining: hourly.remaining,
      dailyRemaining: daily.remaining,
      resetAt,
    };
  } catch (err) {
    console.error("rate limit check failed (failing open)", err);
    return {
      ok: true,
      hourlyRemaining: HOURLY_LIMIT,
      dailyRemaining: DAILY_LIMIT,
      resetAt: null,
    };
  }
}
