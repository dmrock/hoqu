import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

const HOURLY_LIMIT = 50;
const DAILY_LIMIT = 200;
const LOGIN_PER_IP = 20;
const REGISTER_PER_IP = 10;
const FORGOT_PER_IP = 5;
const FORGOT_PER_EMAIL = 3;
const VERIFY_RESEND_PER_USER = 3;
const FRIEND_REQUESTS_PER_USER = 20;
const SEARCHES_PER_USER = 60;

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

const loginPerIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(LOGIN_PER_IP, "10 m"),
  prefix: "ratelimit:auth:login",
  analytics: false,
});

const registerPerIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(REGISTER_PER_IP, "1 h"),
  prefix: "ratelimit:auth:register",
  analytics: false,
});

const forgotPerIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(FORGOT_PER_IP, "1 h"),
  prefix: "ratelimit:auth:forgot:ip",
  analytics: false,
});

const forgotPerEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(FORGOT_PER_EMAIL, "1 h"),
  prefix: "ratelimit:auth:forgot:email",
  analytics: false,
});

const verifyResendPerUser = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(VERIFY_RESEND_PER_USER, "1 h"),
  prefix: "ratelimit:auth:verify-resend",
  analytics: false,
});

const friendRequestPerUser = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(FRIEND_REQUESTS_PER_USER, "1 h"),
  prefix: "ratelimit:friends:request",
  analytics: false,
});

const searchPerUser = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(SEARCHES_PER_USER, "1 m"),
  prefix: "ratelimit:search",
  analytics: false,
});

export type AuthLimitResult = {
  ok: boolean;
  /** Epoch ms when the window resets (only meaningful when ok=false). */
  resetAt: number | null;
};

/**
 * Consume one slot from a single sliding window. Skipped in development —
 * local dev and the e2e suite would trip the windows. Fails open on Redis
 * errors: these limits slow abuse, they are not a lockout mechanism.
 */
async function checkWindow(limiter: Ratelimit, key: string): Promise<AuthLimitResult> {
  if (process.env.NODE_ENV === "development") return { ok: true, resetAt: null };
  try {
    const result = await limiter.limit(key);
    return { ok: result.success, resetAt: result.success ? null : result.reset };
  } catch (err) {
    console.error("rate limit check failed (failing open)", err);
    return { ok: true, resetAt: null };
  }
}

const authLimiters = {
  login: loginPerIp,
  register: registerPerIp,
  forgot: forgotPerIp,
} as const;

/**
 * Per-IP sliding windows on the credentials auth actions: login 20 / 10 min,
 * register 10 / hour, forgot-password 5 / hour.
 */
export async function checkAuthLimit(
  kind: keyof typeof authLimiters,
  ip: string,
): Promise<AuthLimitResult> {
  return checkWindow(authLimiters[kind], ip);
}

/**
 * Per-mailbox window on password-reset requests (3 / hour), keyed by the target
 * email rather than the requester's IP — stops someone bombing one inbox with
 * reset emails from rotating IPs.
 */
export async function checkPasswordResetEmailLimit(email: string): Promise<AuthLimitResult> {
  return checkWindow(forgotPerEmail, email);
}

/**
 * Per-user window on verification-email resends (3 / hour) — the banner button
 * would otherwise let a signed-in user relay spam through our sender.
 */
export async function checkVerifyResendLimit(userId: string): Promise<AuthLimitResult> {
  return checkWindow(verifyResendPerUser, userId);
}

/**
 * Per-sender window on friend requests (20 / hour) — caps how fast one user
 * can fill strangers' pending lists, and makes probing for valid usernames
 * through the "No user with that username" error expensive. The slot is
 * consumed whether or not the target exists.
 */
export async function checkFriendRequestLimit(userId: string): Promise<AuthLimitResult> {
  return checkWindow(friendRequestPerUser, userId);
}

/**
 * Per-user window on the catalog search proxies (60 / minute). The proxies are
 * session-gated but otherwise free to loop, and every cache miss spends a call
 * against TMDB/IGDB/Open Library — this caps what one account can burn through.
 * Well above what the 300ms-debounced search box produces by hand.
 */
export async function checkSearchLimit(userId: string): Promise<AuthLimitResult> {
  return checkWindow(searchPerUser, userId);
}

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
