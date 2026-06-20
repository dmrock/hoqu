"use server";

import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { generateUniqueUsername, slugifyEmail } from "@/lib/auth/username";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { checkAuthLimit, checkPasswordResetEmailLimit } from "@/lib/rate-limit";
import { clientIpFrom } from "@/lib/request-ip";
import { originFrom } from "@/lib/request-url";

const RESET_TOKEN_TTL_MINUTES = 60;

// Emails are stored and compared lowercase so the same mailbox can't register
// twice with different casing (and can always sign back in).
const emailSchema = z.email().transform((s) => s.toLowerCase());

const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

function tooManyAttempts(resetAt: number | null): string {
  const minutes = resetAt ? Math.max(1, Math.ceil((resetAt - Date.now()) / 60_000)) : null;
  return minutes
    ? `Too many attempts — try again in ~${minutes} min.`
    : "Too many attempts — try again later.";
}

export type ActionState = { error: string | null } | null;

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  const limit = await checkAuthLimit("register", clientIpFrom(await headers()));
  if (!limit.ok) return { error: tooManyAttempts(limit.resetAt) };

  // lower() instead of plain equality so pre-normalization rows still match.
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const emailLocal = email.split("@")[0] ?? "user";
  const passwordHash = await hashPassword(password);
  const username = await generateUniqueUsername(slugifyEmail(email));
  await db.insert(users).values({
    email,
    name: emailLocal,
    username,
    passwordHash,
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Registration succeeded but sign-in failed" };
    throw err;
  }

  redirect("/dashboard");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const limit = await checkAuthLimit("login", clientIpFrom(await headers()));
  if (!limit.ok) return { error: tooManyAttempts(limit.resetAt) };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw err;
  }

  redirect("/dashboard");
}

export async function googleSignInAction(): Promise<void> {
  await signIn("google", { redirectTo: "/dashboard" });
}

const forgotSchema = z.object({ email: emailSchema });

// Generic acknowledgement shown whether or not an account exists, so the form
// can't be used to probe which emails are registered.
export type ResetRequestState = { error: string } | { sent: true } | null;

export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email")?.toString() ?? "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email } = parsed.data;

  const [ipLimit, emailLimit] = await Promise.all([
    checkAuthLimit("forgot", clientIpFrom(await headers())),
    checkPasswordResetEmailLimit(email),
  ]);
  if (!ipLimit.ok) return { error: tooManyAttempts(ipLimit.resetAt) };
  if (!emailLimit.ok) return { error: tooManyAttempts(emailLimit.resetAt) };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  // Only credentials users have a password to reset; Google-only accounts get
  // the same generic success without an email.
  if (user?.passwordHash) {
    const token = await issueToken({
      userId: user.id,
      purpose: "password_reset",
      ttlMinutes: RESET_TOKEN_TTL_MINUTES,
    });
    const origin = originFrom(await headers());
    await sendPasswordResetEmail(email, `${origin}/reset-password?token=${token}`);
  }

  return { sent: true };
}

const resetSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export type ResetPasswordState = { error: string } | { ok: true } | null;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const consumed = await consumeToken(parsed.data.token, "password_reset");
  if (!consumed) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  // JWT sessions can't be server-revoked, so existing sessions elsewhere survive
  // the reset — acceptable for a hobby app; the password itself is now changed.
  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, consumed.userId));

  return { ok: true };
}
