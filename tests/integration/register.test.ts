import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3100" }),
}));

import { registerAction } from "@/app/(auth)/actions";
import { hashPassword } from "@/lib/auth/password";
import { withUniqueUsername } from "@/lib/auth/username";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { users } from "@/lib/db/schema";
import { TEST_PASSWORD } from "./helpers/db-helpers";

function registerForm(email: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", TEST_PASSWORD);
  return fd;
}

async function insertUser(email: string, username: string) {
  await db.insert(users).values({
    email,
    name: username,
    username,
    passwordHash: await hashPassword(TEST_PASSWORD),
  });
}

async function usernameFor(email: string) {
  const [row] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.email, email));
  return row?.username;
}

describe("registerAction duplicate email", () => {
  it("returns the friendly error when the email is already registered", async () => {
    await insertUser("taken@int.test", "taken");

    const res = await registerAction(null, registerForm("taken@int.test"));
    expect(res).toEqual({
      error: "An account with this email already exists",
      email: "taken@int.test",
    });
  });

  it("matches case-insensitively in both directions", async () => {
    await insertUser("lower@int.test", "lower");
    const recased = await registerAction(null, registerForm("LoWeR@INT.test"));
    expect(recased?.error).toBe("An account with this email already exists");

    // Pre-normalization rows can still carry uppercase in the column.
    await insertUser("MiXeD@int.test", "mixed");
    const mixedRow = await registerAction(null, registerForm("mixed@int.test"));
    expect(mixedRow?.error).toBe("An account with this email already exists");
  });
});

describe("registration unique-violation handling", () => {
  // The concurrent-registration race surfaces as this driver error on the
  // insert; assert the real shape so the catch in registerAction stays honest.
  it("recognizes the real driver error for a duplicate email", async () => {
    await insertUser("shape@int.test", "shape");

    const err = await db
      .insert(users)
      .values({ email: "shape@int.test", name: "dupe", username: "shape-dupe" })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(isUniqueViolation(err, "users_email_unique")).toBe(true);
    expect(isUniqueViolation(err, "users_username_unique")).toBe(false);
  });

  it("suffixes the username when the email local part is already taken", async () => {
    // Success path ends in redirect("/dashboard"), which throws NEXT_REDIRECT.
    await expect(registerAction(null, registerForm("dup@int.test"))).rejects.toThrow();
    await expect(registerAction(null, registerForm("dup@second.test"))).rejects.toThrow();

    expect(await usernameFor("dup@int.test")).toBe("dup");
    expect(await usernameFor("dup@second.test")).toBe("dup-1");
  });
});

describe("withUniqueUsername", () => {
  it("retries with the next suffix when the write loses a username race", async () => {
    const attempts: string[] = [];

    const result = await withUniqueUsername("clash", async (username) => {
      attempts.push(username);
      if (attempts.length === 1) {
        // Simulate a concurrent signup landing first: its row exists and our
        // write bounced off the unique constraint.
        await insertUser("winner@int.test", username);
        throw Object.assign(new Error("duplicate key"), {
          code: "23505",
          constraint: "users_username_unique",
        });
      }
      return username;
    });

    expect(attempts).toEqual(["clash", "clash-1"]);
    expect(result).toBe("clash-1");
  });

  it("rethrows violations of other constraints", async () => {
    const emailConflict = Object.assign(new Error("duplicate key"), {
      code: "23505",
      constraint: "users_email_unique",
    });

    await expect(
      withUniqueUsername("other", async () => {
        throw emailConflict;
      }),
    ).rejects.toBe(emailConflict);
  });
});
