import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createGuild,
  deleteGuild,
  joinGuildByCode,
  leaveGuild,
  promoteMember,
  rotateInviteCode,
} from "@/app/(main)/guilds/actions";
import { db } from "@/lib/db";
import { guildMembers, guilds } from "@/lib/db/schema";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser } from "./helpers/db-helpers";

async function unique(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function createGuildFor(userId: string, name: string) {
  setTestUserId(userId);
  const result = await createGuild({
    name,
    description: undefined,
    discordInviteUrl: undefined,
  });
  if (!result.ok || !result.data) throw new Error("createGuild failed");
  return result.data.guildId;
}

describe("createGuild", () => {
  it("creates the guild, makes the creator master, generates an 8-char invite code", async () => {
    const alice = await createTestUser();
    const name = await unique("Knights");
    const guildId = await createGuildFor(alice.id, name);

    const [g] = await db.select().from(guilds).where(eq(guilds.id, guildId));
    expect(g?.name).toBe(name);
    expect(g?.inviteCode).toMatch(/^[A-Z0-9]{8}$/);

    const [m] = await db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, alice.id)));
    expect(m?.role).toBe("master");
  });

  it("rejects duplicate guild names", async () => {
    const alice = await createTestUser();
    const name = await unique("Knights");
    await createGuildFor(alice.id, name);

    const dup = await createGuild({
      name,
      description: undefined,
      discordInviteUrl: undefined,
    });
    expect(dup.ok).toBe(false);
  });

  it("rejects when name is shorter than 3 chars", async () => {
    const alice = await createTestUser();
    setTestUserId(alice.id);
    const tooShort = await createGuild({
      name: "ab",
      description: undefined,
      discordInviteUrl: undefined,
    });
    expect(tooShort.ok).toBe(false);
  });
});

describe("joinGuildByCode", () => {
  it("joins the user as a member when the code matches", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");

    setTestUserId(bob.id);
    const result = await joinGuildByCode({ code: g.inviteCode });
    expect(result.ok).toBe(true);

    const [bobMember] = await db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, bob.id)));
    expect(bobMember?.role).toBe("member");
  });

  it("rejects an unknown invite code", async () => {
    const bob = await createTestUser();
    setTestUserId(bob.id);
    const result = await joinGuildByCode({ code: "AAAAAAAA" });
    expect(result.ok).toBe(false);
  });

  it("rejects rejoining when already a member", async () => {
    const alice = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");

    // Alice (already master) tries to join again.
    setTestUserId(alice.id);
    const result = await joinGuildByCode({ code: g.inviteCode });
    expect(result.ok).toBe(false);
  });
});

describe("rotateInviteCode", () => {
  it("master rotates and the old code stops working", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    const oldCode = g.inviteCode;

    setTestUserId(alice.id);
    const rotated = await rotateInviteCode({ guildId });
    expect(rotated.ok).toBe(true);
    if (rotated.ok && rotated.data) expect(rotated.data.inviteCode).not.toBe(oldCode);

    // Old code no longer works.
    setTestUserId(bob.id);
    const join = await joinGuildByCode({ code: oldCode });
    expect(join.ok).toBe(false);
  });

  it("non-master cannot rotate", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    const result = await rotateInviteCode({ guildId });
    expect(result.ok).toBe(false);
  });
});

describe("promoteMember + role enforcement", () => {
  it("master promotes member → officer", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    setTestUserId(alice.id);
    const result = await promoteMember({ guildId, memberUserId: bob.id });
    expect(result.ok).toBe(true);

    const [bobMember] = await db
      .select({ role: guildMembers.role })
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, bob.id)));
    expect(bobMember?.role).toBe("officer");
  });

  it("non-master cannot promote", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const carol = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });
    setTestUserId(carol.id);
    await joinGuildByCode({ code: g.inviteCode });

    // Bob (member) cannot promote Carol.
    setTestUserId(bob.id);
    const result = await promoteMember({ guildId, memberUserId: carol.id });
    expect(result.ok).toBe(false);
  });
});

describe("leaveGuild", () => {
  it("non-master can leave directly", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    const result = await leaveGuild({ guildId });
    expect(result.ok).toBe(true);

    const remaining = await db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, bob.id)));
    expect(remaining).toHaveLength(0);
  });

  it("master cannot leave a non-empty guild", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    setTestUserId(alice.id);
    const result = await leaveGuild({ guildId });
    expect(result.ok).toBe(false);
  });

  it("master leaving a solo guild deletes the guild", async () => {
    const alice = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));

    setTestUserId(alice.id);
    const result = await leaveGuild({ guildId });
    expect(result.ok).toBe(true);

    const remaining = await db.select().from(guilds).where(eq(guilds.id, guildId));
    expect(remaining).toHaveLength(0);
  });
});

describe("deleteGuild", () => {
  it("master can delete, cascading members", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    setTestUserId(alice.id);
    const result = await deleteGuild({ guildId });
    expect(result.ok).toBe(true);

    const remainingGuilds = await db.select().from(guilds).where(eq(guilds.id, guildId));
    expect(remainingGuilds).toHaveLength(0);
    const remainingMembers = await db
      .select()
      .from(guildMembers)
      .where(eq(guildMembers.guildId, guildId));
    expect(remainingMembers).toHaveLength(0);
  });

  it("non-master cannot delete", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const guildId = await createGuildFor(alice.id, await unique("G"));
    const [g] = await db
      .select({ inviteCode: guilds.inviteCode })
      .from(guilds)
      .where(eq(guilds.id, guildId));
    if (!g) throw new Error("guild not found");
    setTestUserId(bob.id);
    await joinGuildByCode({ code: g.inviteCode });

    const result = await deleteGuild({ guildId });
    expect(result.ok).toBe(false);
  });
});
