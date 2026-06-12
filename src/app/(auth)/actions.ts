"use server";

import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { generateUniqueUsername, slugifyEmail } from "@/lib/auth/username";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { checkAuthLimit } from "@/lib/rate-limit";
import { clientIpFrom } from "@/lib/request-ip";

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
