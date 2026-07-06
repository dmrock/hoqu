import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3100" }),
}));

import { registerAction, verifyEmailAction } from "@/app/(auth)/actions";
import { resendVerificationEmailAction } from "@/app/(main)/settings/actions";
import { issueToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { authTokens, users } from "@/lib/db/schema";
import { sendVerificationEmail } from "@/lib/email/send";
import { checkVerifyResendLimit } from "@/lib/rate-limit";
import { setTestUserId } from "./helpers/auth-mock";
import { createTestUser } from "./helpers/db-helpers";

const mockSend = vi.mocked(sendVerificationEmail);

beforeEach(() => {
  mockSend.mockClear();
});

function registerForm(email: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", "int-test-pw-1234");
  return fd;
}

function verifyTokenCount(userId: string) {
  return db.$count(
    authTokens,
    and(eq(authTokens.userId, userId), eq(authTokens.purpose, "email_verify")),
  );
}

describe("registerAction verification", () => {
  it("creates the account unverified, issues a token and emails the link", async () => {
    // Success path ends in redirect("/dashboard"), which throws NEXT_REDIRECT.
    await expect(registerAction(null, registerForm("fresh@int.test"))).rejects.toThrow();

    const [user] = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, "fresh@int.test"));
    if (!user) throw new Error("user not created");
    expect(user.emailVerified).toBeNull();
    expect(await verifyTokenCount(user.id)).toBe(1);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const [to, url] = mockSend.mock.calls[0] ?? [];
    expect(to).toBe("fresh@int.test");
    expect(url).toContain("/verify-email?token=");
  });

  it("sets emailVerified when the emailed token is consumed, and burns it", async () => {
    await expect(registerAction(null, registerForm("clicks@int.test"))).rejects.toThrow();

    const [to, url] = mockSend.mock.calls[0] ?? [];
    expect(to).toBe("clicks@int.test");
    const token = new URL(url ?? "").searchParams.get("token");
    if (!token) throw new Error("no token in emailed link");

    expect(await verifyEmailAction(token)).toEqual({ ok: true });

    const [user] = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, "clicks@int.test"));
    expect(user?.emailVerified).toBeInstanceOf(Date);
    expect(await verifyTokenCount(user?.id ?? "")).toBe(0);

    // Single-use: a second click on the same link fails.
    const reuse = await verifyEmailAction(token);
    expect(reuse.ok).toBe(false);
  });
});

describe("verifyEmailAction rejections", () => {
  it("rejects an expired token without verifying the account", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "email_verify", ttlMinutes: -1 });

    const res = await verifyEmailAction(raw);
    expect(res.ok).toBe(false);

    const [row] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, user.id));
    expect(row?.emailVerified).toBeNull();
  });

  it("rejects a garbage token", async () => {
    const res = await verifyEmailAction("not-a-real-token");
    expect(res.ok).toBe(false);
  });

  it("rejects a token issued for another purpose", async () => {
    const user = await createTestUser();
    const raw = await issueToken({ userId: user.id, purpose: "password_reset", ttlMinutes: 60 });
    const res = await verifyEmailAction(raw);
    expect(res.ok).toBe(false);
  });
});

describe("resendVerificationEmailAction", () => {
  it("issues a fresh token and re-sends the link for an unverified user", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);

    expect(await resendVerificationEmailAction()).toEqual({ ok: true });
    expect(await verifyTokenCount(user.id)).toBe(1);
    expect(mockSend).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining("/verify-email?token="),
    );
  });

  it("is rate-limited per user", async () => {
    const user = await createTestUser();
    setTestUserId(user.id);
    vi.mocked(checkVerifyResendLimit).mockResolvedValueOnce({
      ok: false,
      resetAt: Date.now() + 30 * 60_000,
    });

    const res = await resendVerificationEmailAction();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/try again/i);
    expect(await verifyTokenCount(user.id)).toBe(0);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("refuses when the email is already verified", async () => {
    const user = await createTestUser();
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, user.id));
    setTestUserId(user.id);

    const res = await resendVerificationEmailAction();
    expect(res.ok).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    const res = await resendVerificationEmailAction();
    expect(res).toEqual({ ok: false, error: "Unauthorized" });
  });
});
