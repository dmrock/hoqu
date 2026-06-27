import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/app/(main)/friends/actions";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { countIncomingRequests } from "@/lib/friendships";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser } from "./helpers/db-helpers";

async function loadFriendship(requesterId: string, addresseeId: string) {
  const [row] = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, addresseeId)))
    .limit(1);
  return row;
}

describe("sendFriendRequest", () => {
  it("creates a pending row from requester to addressee", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    setTestUserId(alice.id);

    const result = await sendFriendRequest({ username: bob.username });
    expect(result.ok).toBe(true);

    const row = await loadFriendship(alice.id, bob.id);
    expect(row?.status).toBe("pending");
  });

  it("rejects friending yourself", async () => {
    const alice = await createTestUser();
    setTestUserId(alice.id);

    const result = await sendFriendRequest({ username: alice.username });
    expect(result.ok).toBe(false);
  });

  it("rejects when the target username doesn't exist", async () => {
    const alice = await createTestUser();
    setTestUserId(alice.id);

    const result = await sendFriendRequest({ username: "nobody-here" });
    expect(result.ok).toBe(false);
  });

  it("rejects a duplicate pending request in either direction", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });

    // Sending again from alice fails.
    const dupSame = await sendFriendRequest({ username: bob.username });
    expect(dupSame.ok).toBe(false);

    // Reverse direction also fails (bob can't request alice while a request exists).
    setTestUserId(bob.id);
    const dupReverse = await sendFriendRequest({ username: alice.username });
    expect(dupReverse.ok).toBe(false);
  });
});

describe("acceptFriendRequest", () => {
  it("flips status to accepted (only the addressee can accept)", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    const pending = await loadFriendship(alice.id, bob.id);
    if (!pending) throw new Error("pending row missing");

    // Requester cannot accept their own request.
    const wrong = await acceptFriendRequest({ friendshipId: pending.id });
    expect(wrong.ok).toBe(false);

    // Addressee accepts → accepted.
    setTestUserId(bob.id);
    const ok = await acceptFriendRequest({ friendshipId: pending.id });
    expect(ok.ok).toBe(true);

    const accepted = await loadFriendship(alice.id, bob.id);
    expect(accepted?.status).toBe("accepted");
  });
});

describe("declineFriendRequest", () => {
  it("deletes the pending row when the addressee declines", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    const pending = await loadFriendship(alice.id, bob.id);
    if (!pending) throw new Error("pending row missing");

    setTestUserId(bob.id);
    const result = await declineFriendRequest({ friendshipId: pending.id });
    expect(result.ok).toBe(true);

    const after = await loadFriendship(alice.id, bob.id);
    expect(after).toBeUndefined();
  });
});

describe("cancelFriendRequest", () => {
  it("deletes the pending row when the requester cancels", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    const pending = await loadFriendship(alice.id, bob.id);
    if (!pending) throw new Error("pending row missing");

    const result = await cancelFriendRequest({ friendshipId: pending.id });
    expect(result.ok).toBe(true);

    expect(await loadFriendship(alice.id, bob.id)).toBeUndefined();
  });
});

describe("removeFriend", () => {
  it("removes an accepted friendship from either side", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    const pending = await loadFriendship(alice.id, bob.id);
    if (!pending) throw new Error("pending row missing");
    setTestUserId(bob.id);
    await acceptFriendRequest({ friendshipId: pending.id });

    // Bob (addressee) removes the friendship.
    const result = await removeFriend({ friendshipId: pending.id });
    expect(result.ok).toBe(true);
    expect(await loadFriendship(alice.id, bob.id)).toBeUndefined();
  });
});

describe("countIncomingRequests", () => {
  it("returns 0 when there are no incoming requests", async () => {
    const bob = await createTestUser();
    expect(await countIncomingRequests(bob.id)).toBe(0);
  });

  it("counts pending incoming requests only", async () => {
    const alice = await createTestUser();
    const carol = await createTestUser();
    const bob = await createTestUser();

    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    setTestUserId(carol.id);
    await sendFriendRequest({ username: bob.username });

    expect(await countIncomingRequests(bob.id)).toBe(2);
  });

  it("ignores pending outgoing requests", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    // Bob is the requester here, so this is outgoing for him — not counted.
    setTestUserId(bob.id);
    await sendFriendRequest({ username: alice.username });

    expect(await countIncomingRequests(bob.id)).toBe(0);
  });

  it("ignores accepted friendships", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    const pending = await loadFriendship(alice.id, bob.id);
    if (!pending) throw new Error("pending row missing");
    setTestUserId(bob.id);
    await acceptFriendRequest({ friendshipId: pending.id });

    expect(await countIncomingRequests(bob.id)).toBe(0);
  });
});
