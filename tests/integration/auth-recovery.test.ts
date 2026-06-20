import { and, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3100" }),
}));

import { requestPasswordResetAction, resetPasswordAction } from "@/app/(auth)/actions";
import { confirmEmailChangeAction } from "@/app/(main)/settings/actions";
import { verifyPassword } from "@/lib/auth/password";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { hashToken } from "@/lib/auth/tokens-crypto";
import { db } from "@/lib/db";
import { authTokens, users } from "@/lib/db/schema";
import { createTestUser } from "./helpers/db-helpers";

describe("issueToken / consumeToken", () => {
  it("issues a token whose hash is stored (never the raw value)", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });

    const [row] = await db.select().from(authTokens).where(eq(authTokens.userId, user.id));
    expect(row?.tokenHash).toBe(hashToken(raw));
    expect(row?.tokenHash).not.toBe(raw);
  });

  it("consumes a valid token once and rejects reuse", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });

    expect(await consumeToken(raw, "password_reset")).toEqual({ userId: user.id, newEmail: null });
    expect(await consumeToken(raw, "password_reset")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: -1 });
    expect(await consumeToken(raw, "password_reset")).toBeNull();
  });

  it("rejects a token used for the wrong purpose", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });
    expect(await consumeToken(raw, "email_change")).toBeNull();
  });

  it("supersedes an earlier token of the same purpose", async () => {
    const user = await createTestUser();
    const first = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });
    await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });

    expect(await consumeToken(first, "password_reset")).toBeNull();
    const count = await db.$count(authTokens, eq(authTokens.userId, user.id));
    expect(count).toBe(1);
  });
});

describe("resetPasswordAction", () => {
  it("changes the password and burns the token", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });

    const fd = new FormData();
    fd.set("token", raw);
    fd.set("password", "brand-new-pw-9999");
    const res = await resetPasswordAction(null, fd);
    expect(res).toEqual({ ok: true });

    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id));
    expect(await verifyPassword("brand-new-pw-9999", row?.passwordHash ?? "")).toBe(true);
    expect(await db.$count(authTokens, eq(authTokens.userId, user.id))).toBe(0);
  });

  it("rejects an invalid token without touching the password", async () => {
    const fd = new FormData();
    fd.set("token", "not-a-real-token");
    fd.set("password", "brand-new-pw-9999");
    const res = await resetPasswordAction(null, fd);
    expect(res).not.toEqual({ ok: true });
  });
});

describe("confirmEmailChangeAction", () => {
  it("switches the email and marks it verified", async () => {
    const user = await createTestUser();
    const raw = await issueToken({
      userId: user.id,
      purpose: "email_change",
      ttlMinutes: 60,
      newEmail: "moved@int.test",
    });

    const res = await confirmEmailChangeAction(raw);
    expect(res).toEqual({ ok: true });

    const [row] = await db
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, user.id));
    expect(row?.email).toBe("moved@int.test");
    expect(row?.emailVerified).toBeInstanceOf(Date);
  });

  it("rejects when the target email was taken since the request", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const raw = await issueToken({
      userId: user.id,
      purpose: "email_change",
      ttlMinutes: 60,
      newEmail: other.email,
    });

    const res = await confirmEmailChangeAction(raw);
    expect(res.ok).toBe(false);
  });
});

describe("requestPasswordResetAction", () => {
  function form(email: string) {
    const fd = new FormData();
    fd.set("email", email);
    return fd;
  }

  it("issues a reset token for an existing credentials user", async () => {
    const user = await createTestUser();
    expect(await requestPasswordResetAction(null, form(user.email))).toEqual({ sent: true });
    const count = await db.$count(
      authTokens,
      and(eq(authTokens.userId, user.id), eq(authTokens.purpose, "password_reset")),
    );
    expect(count).toBe(1);
  });

  it("acknowledges an unknown email without issuing a token (no enumeration)", async () => {
    expect(await requestPasswordResetAction(null, form("nobody@int.test"))).toEqual({ sent: true });
    expect(await db.$count(authTokens)).toBe(0);
  });

  it("issues no token for a Google-only account that has no password", async () => {
    const [u] = await db
      .insert(users)
      .values({ email: "google@int.test", username: "google-int", name: "G" })
      .returning({ id: users.id });
    expect(await requestPasswordResetAction(null, form("google@int.test"))).toEqual({ sent: true });
    expect(await db.$count(authTokens, eq(authTokens.userId, u?.id ?? ""))).toBe(0);
  });
});
