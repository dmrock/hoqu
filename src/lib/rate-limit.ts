import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

const HOURLY_LIMIT = 50;
const DAILY_LIMIT = 200;
const LOGIN_PER_IP = 20;
const REGISTER_PER_IP = 10;
const FORGOT_PER_IP = 5;
const FORGOT_PER_EMAIL = 3;

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

export type AuthLimitResult = {
  ok: boolean;
  /** Epoch ms when the window resets (only meaningful when ok=false). */
  resetAt: number | null;
};

const authLimiters = {
  login: loginPerIp,
  register: registerPerIp,
  forgot: forgotPerIp,
} as const;

/**
 * Per-IP sliding windows on the credentials auth actions: login 20 / 10 min,
 * register 10 / hour, forgot-password 5 / hour. Skipped in development — local
 * dev and the e2e suite both hit the server from 127.0.0.1 and would trip the
 * windows. Fails open like the add-item limits: this slows credential stuffing
 * and signup spam, it is not a lockout mechanism.
 */
export async function checkAuthLimit(
  kind: keyof typeof authLimiters,
  ip: string,
): Promise<AuthLimitResult> {
  if (process.env.NODE_ENV === "development") return { ok: true, resetAt: null };
  try {
    const result = await authLimiters[kind].limit(ip);
    return { ok: result.success, resetAt: result.success ? null : result.reset };
  } catch (err) {
    console.error("auth rate limit check failed (failing open)", err);
    return { ok: true, resetAt: null };
  }
}

/**
 * Per-mailbox window on password-reset requests (3 / hour), keyed by the target
 * email rather than the requester's IP — stops someone bombing one inbox with
 * reset emails from rotating IPs. Same dev-skip + fail-open posture as the
 * per-IP limits.
 */
export async function checkPasswordResetEmailLimit(email: string): Promise<AuthLimitResult> {
  if (process.env.NODE_ENV === "development") return { ok: true, resetAt: null };
  try {
    const result = await forgotPerEmail.limit(email);
    return { ok: result.success, resetAt: result.success ? null : result.reset };
  } catch (err) {
    console.error("auth rate limit check failed (failing open)", err);
    return { ok: true, resetAt: null };
  }
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
