import { and, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3100" }),
}));

import {
  changePasswordAction,
  deleteAccountAction,
  requestEmailChangeAction,
} from "@/app/(main)/settings/actions";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { authTokens, guildMembers, guilds, users } from "@/lib/db/schema";
import { generateInviteCode } from "@/lib/guilds";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser, fetchUser, TEST_PASSWORD } from "./helpers/db-helpers";

describe("changePasswordAction", () => {
  it("rejects an incorrect current password", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const res = await changePasswordAction({
      currentPassword: "wrong-password",
      newPassword: "the-new-password-1",
    });
    expect(res.ok).toBe(false);
  });

  it("updates the password when the current one matches", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const res = await changePasswordAction({
      currentPassword: TEST_PASSWORD,
      newPassword: "the-new-password-1",
    });
    expect(res).toEqual({ ok: true });

    const row = await fetchUser(user.id);
    expect(await verifyPassword("the-new-password-1", row?.passwordHash ?? "")).toBe(true);
  });

  it("lets a Google-only account set a password without a current one", async () => {
    const [u] = await db
      .insert(users)
      .values({ email: "nopw@int.test", username: "nopw-int", name: "No PW" })
      .returning({ id: users.id });
    setTestUserId(u?.id ?? null);

    const res = await changePasswordAction({ newPassword: "first-password-1" });
    expect(res).toEqual({ ok: true });
    const row = await fetchUser(u?.id ?? "");
    expect(await verifyPassword("first-password-1", row?.passwordHash ?? "")).toBe(true);
  });
});

describe("requestEmailChangeAction", () => {
  it("issues an email_change token carrying the new address", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const res = await requestEmailChangeAction({
      currentPassword: TEST_PASSWORD,
      newEmail: "Next@Int.Test",
    });
    expect(res).toEqual({ ok: true });

    const [row] = await db
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.userId, user.id), eq(authTokens.purpose, "email_change")));
    expect(row?.newEmail).toBe("next@int.test");
    // The address only changes after confirmation.
    expect((await fetchUser(user.id))?.email).toBe(user.email);
  });

  it("rejects an email already in use and a wrong password", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    setTestUserId(user.id);

    expect(
      (await requestEmailChangeAction({ currentPassword: "nope", newEmail: "x@int.test" })).ok,
    ).toBe(false);
    expect(
      (await requestEmailChangeAction({ currentPassword: TEST_PASSWORD, newEmail: other.email }))
        .ok,
    ).toBe(false);
  });
});

describe("deleteAccountAction", () => {
  it("requires the exact username to confirm", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    const res = await deleteAccountAction({ confirmUsername: "not-my-name" });
    expect(res.ok).toBe(false);
    expect(await fetchUser(user.id)).toBeTruthy();
  });

  it("promotes a successor before deleting a master with other members", async () => {
    const master = await createTestUser();
    const member = await createTestUser();
    const guildId = crypto.randomUUID();
    await db
      .insert(guilds)
      .values({ id: guildId, name: `G ${guildId.slice(0, 8)}`, inviteCode: generateInviteCode() });
    await db.batch([
      db.insert(guildMembers).values({
        guildId,
        userId: master.id,
        role: "master",
        joinedAt: new Date(Date.now() - 10_000),
      }),
      db.insert(guildMembers).values({ guildId, userId: member.id, role: "member" }),
    ]);

    setTestUserId(master.id);
    const res = await deleteAccountAction({ confirmUsername: master.username });
    expect(res).toEqual({ ok: true });

    expect(await fetchUser(master.id)).toBeFalsy();
    const [promoted] = await db
      .select({ role: guildMembers.role })
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, member.id)));
    expect(promoted?.role).toBe("master");
  });

  it("deletes a guild where the departing master is the only member", async () => {
    const master = await createTestUser();
    const guildId = crypto.randomUUID();
    await db.insert(guilds).values({
      id: guildId,
      name: `Solo ${guildId.slice(0, 8)}`,
      inviteCode: generateInviteCode(),
    });
    await db.insert(guildMembers).values({ guildId, userId: master.id, role: "master" });

    setTestUserId(master.id);
    const res = await deleteAccountAction({ confirmUsername: master.username });
    expect(res).toEqual({ ok: true });

    expect(await fetchUser(master.id)).toBeFalsy();
    expect(await db.$count(guilds, eq(guilds.id, guildId))).toBe(0);
  });

  it("promotes an officer over an earlier-joined member", async () => {
    const master = await createTestUser();
    const earlyMember = await createTestUser();
    const officer = await createTestUser();
    const guildId = crypto.randomUUID();
    await db.insert(guilds).values({
      id: guildId,
      name: `Rank ${guildId.slice(0, 8)}`,
      inviteCode: generateInviteCode(),
    });
    // The member joined before the officer — a naive "earliest joiner wins" rule
    // would pick them; rank-first selection must pick the officer instead.
    await db.batch([
      db.insert(guildMembers).values({
        guildId,
        userId: master.id,
        role: "master",
        joinedAt: new Date(Date.now() - 30_000),
      }),
      db.insert(guildMembers).values({
        guildId,
        userId: earlyMember.id,
        role: "member",
        joinedAt: new Date(Date.now() - 20_000),
      }),
      db.insert(guildMembers).values({
        guildId,
        userId: officer.id,
        role: "officer",
        joinedAt: new Date(Date.now() - 10_000),
      }),
    ]);

    setTestUserId(master.id);
    expect(await deleteAccountAction({ confirmUsername: master.username })).toEqual({ ok: true });

    const roles = await db
      .select({ userId: guildMembers.userId, role: guildMembers.role })
      .from(guildMembers)
      .where(eq(guildMembers.guildId, guildId));
    expect(roles.find((r) => r.userId === officer.id)?.role).toBe("master");
    expect(roles.find((r) => r.userId === earlyMember.id)?.role).toBe("member");
  });
});
