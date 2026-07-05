"use server";

import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { alias } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { z } from "zod";
import { requireUserId, signOut } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import {
  achievements,
  guildMembers,
  guilds,
  hobbies,
  items,
  userAchievements,
  users,
} from "@/lib/db/schema";
import { sendEmailChangeEmail } from "@/lib/email/send";
import type { DataExport } from "@/lib/export";
import { originFrom } from "@/lib/request-url";

const EMAIL_CHANGE_TTL_MINUTES = 60;

export type ActionResult = { ok: true } | { ok: false; error: string };

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(100);
const emailSchema = z.email("Enter a valid email").transform((s) => s.toLowerCase());

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

/**
 * Change (credentials users) or set (Google-only users, who have no
 * passwordHash yet) the account password. Setting one lets a Google user also
 * sign in with email + password later.
 */
export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return { ok: false, error: "Account not found" };

  if (user.passwordHash) {
    const current = parsed.data.currentPassword ?? "";
    if (!current) return { ok: false, error: "Enter your current password" };
    const valid = await verifyPassword(current, user.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect" };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return { ok: true };
}

const requestEmailChangeSchema = z.object({
  currentPassword: z.string().optional(),
  newEmail: emailSchema,
});

export type RequestEmailChangeInput = z.input<typeof requestEmailChangeSchema>;

/**
 * Start an email change. Sends a confirmation link to the NEW address; the
 * switch only happens once that link is opened (see confirmEmailChangeAction).
 * Only available to credentials users — Google-only accounts get their email
 * from the provider.
 */
export async function requestEmailChangeAction(
  input: RequestEmailChangeInput,
): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = requestEmailChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { newEmail } = parsed.data;

  const [user] = await db
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return { ok: false, error: "Account not found" };

  if (!user.passwordHash) {
    return { ok: false, error: "Email changes aren't available for Google sign-in accounts" };
  }
  const valid = await verifyPassword(parsed.data.currentPassword ?? "", user.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect" };

  if (newEmail === user.email.toLowerCase()) {
    return { ok: false, error: "That's already your email" };
  }
  if (await emailTaken(newEmail, session.userId)) {
    return { ok: false, error: "That email is already in use" };
  }

  const token = await issueToken({
    userId: session.userId,
    purpose: "email_change",
    ttlMinutes: EMAIL_CHANGE_TTL_MINUTES,
    newEmail,
  });
  const origin = originFrom(await headers());
  await sendEmailChangeEmail(newEmail, `${origin}/confirm-email?token=${token}`);

  return { ok: true };
}

/**
 * Apply a confirmed email change. Token-authorized rather than session-gated so
 * the link works even when opened on a device that isn't signed in. Uniqueness
 * is re-checked at apply time to cover the window since the request.
 */
export async function confirmEmailChangeAction(token: string): Promise<ActionResult> {
  const consumed = await consumeToken(token, "email_change");
  if (!consumed?.newEmail) {
    return { ok: false, error: "This link is invalid or has expired. Request a new one." };
  }

  if (await emailTaken(consumed.newEmail, consumed.userId)) {
    return { ok: false, error: "That email is now in use by another account." };
  }

  await db
    .update(users)
    .set({ email: consumed.newEmail, emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.id, consumed.userId));

  return { ok: true };
}

const deleteAccountSchema = z.object({ confirmUsername: z.string().trim() });

export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;

const ROLE_RANK: Record<"master" | "officer" | "member", number> = {
  master: 0,
  officer: 1,
  member: 2,
};

/**
 * Permanently delete the account. Confirmed by typing the exact username. Guild
 * mastership is resolved first so no guild is left masterless: a sole-member
 * guild is deleted, otherwise the senior remaining member (officer first, then
 * earliest joiner) is promoted to master — mirroring transferOwnership in the
 * guild actions. The user row delete then cascades to items, friendships,
 * guild_members, user_achievements, accounts and auth_tokens.
 */
export async function deleteAccountAction(input: DeleteAccountInput): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const userId = session.userId;

  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { ok: false, error: "Account not found" };

  if (!user.username || parsed.data.confirmUsername.toLowerCase() !== user.username) {
    return { ok: false, error: "Type your username exactly to confirm" };
  }

  const masteredGuilds = await db
    .select({ guildId: guildMembers.guildId })
    .from(guildMembers)
    .where(and(eq(guildMembers.userId, userId), eq(guildMembers.role, "master")));

  const writes: BatchItem<"pg">[] = [];
  for (const { guildId } of masteredGuilds) {
    const others = await db
      .select({
        userId: guildMembers.userId,
        role: guildMembers.role,
        joinedAt: guildMembers.joinedAt,
      })
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), ne(guildMembers.userId, userId)));

    if (others.length === 0) {
      // Sole member: deleting the guild cascades the membership rows.
      writes.push(db.delete(guilds).where(eq(guilds.id, guildId)));
      continue;
    }

    others.sort(
      (a, b) =>
        ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.joinedAt.getTime() - b.joinedAt.getTime(),
    );
    const successor = others[0];
    if (successor) {
      writes.push(
        db
          .update(guildMembers)
          .set({ role: "master" })
          .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, successor.userId))),
      );
    }
  }

  writes.push(db.delete(users).where(eq(users.id, userId)));
  await db.batch(writes as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  await signOut({ redirectTo: "/" });
  return { ok: true };
}

export type ExportDataResult = { ok: true; data: DataExport } | { ok: false; error: string };

/**
 * Full snapshot of the user's logged data for download: every item row
 * (including TV show parents and their season rows), profile counters and
 * unlocked achievements. Read-only, so no rate limit — just the auth gate.
 * Dates are serialized to ISO strings so the payload is plain JSON.
 */
export async function exportDataAction(): Promise<ExportDataResult> {
  const session = await requireUserId();
  if (!session.ok) return session;
  const userId = session.userId;

  const parentItems = alias(items, "parent_items");

  const [profileRows, itemRows, achievementRows] = await Promise.all([
    db
      .select({
        username: users.username,
        totalPoints: users.totalPoints,
        moviesCompleted: users.moviesCompleted,
        showsCompleted: users.showsCompleted,
        gamesCompleted: users.gamesCompleted,
        booksCompleted: users.booksCompleted,
        itemsRated: users.itemsRated,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        title: items.title,
        hobby: hobbies.slug,
        externalId: items.externalId,
        status: items.status,
        userRating: items.userRating,
        note: items.note,
        wouldRevisit: items.wouldRevisit,
        year: items.year,
        seasonNumber: items.seasonNumber,
        seasonCount: items.seasonCount,
        parentExternalId: parentItems.externalId,
        parentTitle: parentItems.title,
        completedAt: items.completedAt,
        createdAt: items.createdAt,
      })
      .from(items)
      .innerJoin(hobbies, eq(hobbies.id, items.hobbyId))
      .leftJoin(parentItems, eq(parentItems.id, items.parentItemId))
      .where(eq(items.userId, userId))
      // Season externalIds are "{showId}:s{n}", so this keeps each show's
      // seasons grouped right after their parent row.
      .orderBy(asc(hobbies.slug), asc(items.externalId)),
    db
      .select({ slug: achievements.slug, unlockedAt: userAchievements.unlockedAt })
      .from(userAchievements)
      .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
      .where(eq(userAchievements.userId, userId))
      .orderBy(asc(userAchievements.unlockedAt)),
  ]);

  const profile = profileRows[0];
  if (!profile) return { ok: false, error: "Account not found" };

  return {
    ok: true,
    data: {
      exportedAt: new Date().toISOString(),
      profile,
      items: itemRows.map((row) => ({
        ...row,
        completedAt: row.completedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      achievements: achievementRows.map((row) => ({
        slug: row.slug,
        unlockedAt: row.unlockedAt.toISOString(),
      })),
    },
  };
}

async function emailTaken(email: string, exceptUserId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, exceptUserId)))
    .limit(1);
  return Boolean(row);
}
