"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { friendships, users } from "@/lib/db/schema";
import { checkFriendRequestLimit } from "@/lib/rate-limit";
import { minutesUntilReset } from "@/lib/rate-limit-format";

export type ActionResult = { ok: true } | { ok: false; error: string };

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Enter a username")
  .max(20)
  .transform((s) => s.toLowerCase());

const sendFriendRequestSchema = z.object({ username: usernameSchema });
const friendshipIdSchema = z.object({ friendshipId: z.uuid() });

export async function sendFriendRequest(input: { username: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = sendFriendRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const userId = session.userId;
  const target = parsed.data.username;

  // Before any DB work — the slot is spent even on "no such user", so bulk
  // username probing costs quota too.
  const limit = await checkFriendRequestLimit(userId);
  if (!limit.ok) {
    const minutes = minutesUntilReset(limit.resetAt);
    const error = minutes
      ? `Take a breather — you've hit the friend request limit. Back in ~${minutes} min.`
      : "Take a breather — you've hit the friend request limit.";
    return { ok: false, error };
  }

  const [other] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, target))
    .limit(1);
  if (!other) return { ok: false, error: "No user with that username" };
  if (other.id === userId) return { ok: false, error: "You can't friend yourself" };

  const [existing] = await db
    .select({ id: friendships.id, status: friendships.status })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, other.id)),
        and(eq(friendships.requesterId, other.id), eq(friendships.addresseeId, userId)),
      ),
    )
    .limit(1);
  if (existing) {
    if (existing.status === "accepted") return { ok: false, error: "Already friends" };
    if (existing.status === "pending") return { ok: false, error: "Request already pending" };
  }

  // The pre-check above can't see a row inserted between it and this insert
  // (double-click, or simultaneous A→B and B→A). The pair unique index makes
  // the loser surface here; map it to the same error the pre-check would give.
  try {
    await db.insert(friendships).values({
      requesterId: userId,
      addresseeId: other.id,
      status: "pending",
    });
  } catch (err) {
    if (isUniqueViolation(err, "friendships_pair_unique")) {
      return { ok: false, error: "Request already pending" };
    }
    throw err;
  }

  revalidatePath("/friends");
  revalidatePath(`/profile/${target}`);
  return { ok: true };
}

export async function acceptFriendRequest(input: { friendshipId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = friendshipIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const result = await db
    .update(friendships)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(
      and(
        eq(friendships.id, parsed.data.friendshipId),
        eq(friendships.addresseeId, userId),
        eq(friendships.status, "pending"),
      ),
    )
    .returning({ id: friendships.id });

  if (result.length === 0) return { ok: false, error: "Request not found" };

  revalidatePath("/friends");
  return { ok: true };
}

export async function declineFriendRequest(input: { friendshipId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = friendshipIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  // Delete on decline so the requester can try again later. We never write the
  // "declined" status; it's available in the schema but unused for now.
  const result = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, parsed.data.friendshipId),
        eq(friendships.addresseeId, userId),
        eq(friendships.status, "pending"),
      ),
    )
    .returning({ id: friendships.id });

  if (result.length === 0) return { ok: false, error: "Request not found" };

  revalidatePath("/friends");
  return { ok: true };
}

export async function cancelFriendRequest(input: { friendshipId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = friendshipIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const result = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, parsed.data.friendshipId),
        eq(friendships.requesterId, userId),
        eq(friendships.status, "pending"),
      ),
    )
    .returning({ id: friendships.id });

  if (result.length === 0) return { ok: false, error: "Request not found" };

  revalidatePath("/friends");
  return { ok: true };
}

export async function removeFriend(input: { friendshipId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = friendshipIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const userId = session.userId;
  const result = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.id, parsed.data.friendshipId),
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      ),
    )
    .returning({ id: friendships.id });

  if (result.length === 0) return { ok: false, error: "Friendship not found" };

  revalidatePath("/friends");
  return { ok: true };
}
