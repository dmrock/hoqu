import { describe, expect, it } from "vitest";
import { updateProfile } from "@/app/(main)/profile/[username]/actions";
import { getFriendshipStatus } from "@/lib/friendships";
import { shareGuild } from "@/lib/guilds";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser, fetchUser } from "./helpers/db-helpers";

describe("updateProfile", () => {
  it("updates name, username, and visibility", async () => {
    const user = await createTestUser({ username: "alice-orig" });
    setTestUserId(user.id);

    const result = await updateProfile({
      name: "Alice",
      username: "alice-new",
      profileVisibility: "friends_only",
    });
    expect(result.ok).toBe(true);

    const updated = await fetchUser(user.id);
    expect(updated?.name).toBe("Alice");
    expect(updated?.username).toBe("alice-new");
    expect(updated?.profileVisibility).toBe("friends_only");
  });

  it("rejects a username already taken by another user", async () => {
    const alice = await createTestUser({ username: "alice-x" });
    const bob = await createTestUser({ username: "bob-x" });
    setTestUserId(alice.id);

    const result = await updateProfile({
      name: "Alice",
      username: bob.username,
      profileVisibility: "public",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe("username");
  });

  it("rejects an invalid username (uppercase / underscores)", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const upper = await updateProfile({
      name: "Test",
      username: "Alice",
      profileVisibility: "public",
    });
    expect(upper.ok).toBe(false);

    const underscore = await updateProfile({
      name: "Test",
      username: "alice_smith",
      profileVisibility: "public",
    });
    expect(underscore.ok).toBe(false);
  });
});

describe("visibility helpers", () => {
  it("getFriendshipStatus reflects pending → accepted transitions", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    expect((await getFriendshipStatus(alice.id, bob.id)).status).toBe("none");

    const { sendFriendRequest, acceptFriendRequest } = await import("@/app/(main)/friends/actions");
    setTestUserId(alice.id);
    await sendFriendRequest({ username: bob.username });
    expect((await getFriendshipStatus(alice.id, bob.id)).status).toBe("pending_outgoing");
    expect((await getFriendshipStatus(bob.id, alice.id)).status).toBe("pending_incoming");

    setTestUserId(bob.id);
    const { db } = await import("@/lib/db");
    const { friendships } = await import("@/lib/db/schema");
    const [pending] = await db.select().from(friendships);
    if (!pending) throw new Error("pending row missing");
    await acceptFriendRequest({ friendshipId: pending.id });

    expect((await getFriendshipStatus(alice.id, bob.id)).status).toBe("friends");
    expect((await getFriendshipStatus(bob.id, alice.id)).status).toBe("friends");
  });

  it("shareGuild is true when both users belong to the same guild", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const carol = await createTestUser();

    const { createGuild, joinGuildByCode } = await import("@/app/(main)/guilds/actions");
    const { db } = await import("@/lib/db");
    const { guilds } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    setTestUserId(alice.id);
    const create = await createGuild({
      name: `Guild ${Date.now()}`,
      description: undefined,
      discordInviteUrl: undefined,
    });
    if (!create.ok || !create.data) throw new Error("createGuild failed");
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, create.data.guildId));
    if (!g) throw new Error("guild not found");

    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    expect(await shareGuild(alice.id, bob.id)).toBe(true);
    expect(await shareGuild(alice.id, carol.id)).toBe(false);
  });
});
