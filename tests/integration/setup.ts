import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, vi } from "vitest";
import { claimWorkerSlot, releaseWorkerSlot, workerDatabaseUrl } from "./helpers/worker-db";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env.test.local", override: true, quiet: true });

if (!process.env.E2E_DATABASE_URL) {
  throw new Error("E2E_DATABASE_URL must be set in .env.test.local");
}
// Point this worker at its own database (provisioned in global-setup) before
// anything imports `db` — the connection URL is read at module load.
process.env.DATABASE_URL = workerDatabaseUrl(process.env.E2E_DATABASE_URL, await claimWorkerSlot());

// Stub @/lib/auth entirely. Importing the real module would pull in next-auth,
// which transitively imports `next/server` and only resolves under the Next
// bundler — not under Vitest's Node runtime.
vi.mock("@/lib/auth", async () => {
  const authMock = await import("./helpers/auth-mock");
  return {
    requireUserId: async () => {
      const id = authMock.getTestUserId();
      if (!id) return { ok: false as const, error: "Unauthorized" };
      return { ok: true as const, userId: id };
    },
    auth: async () => {
      const id = authMock.getTestUserId();
      if (!id) return null;
      return { user: { id } };
    },
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

// The (auth) server actions import `AuthError` straight from next-auth, which
// transitively pulls `next/server` — unresolvable outside the Next bundler.
// @/lib/auth itself is fully mocked above, so a stub AuthError is all we need.
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAddItemLimit: vi.fn(async () => ({ ok: true as const, slotsLeft: 50 })),
  checkAuthLimit: vi.fn(async () => ({ ok: true as const, resetAt: null })),
  checkPasswordResetEmailLimit: vi.fn(async () => ({ ok: true as const, resetAt: null })),
  checkVerifyResendLimit: vi.fn(async () => ({ ok: true as const, resetAt: null })),
  checkFriendRequestLimit: vi.fn(async () => ({ ok: true as const, resetAt: null })),
}));

vi.mock("@/lib/email/send", () => ({
  sendPasswordResetEmail: vi.fn(async () => true),
  sendEmailChangeEmail: vi.fn(async () => true),
  sendVerificationEmail: vi.fn(async () => true),
}));

vi.mock("next/cache", async () => {
  const actual = await vi.importActual<typeof import("next/cache")>("next/cache");
  return {
    ...actual,
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  };
});

vi.mock("@/lib/api/tmdb", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/tmdb")>("@/lib/api/tmdb");
  return {
    ...actual,
    getTvShow: vi.fn(async () => ({
      externalId: "1",
      title: "Mocked Show",
      year: 2020,
      imageUrl: null,
      externalRating: 8,
      seasons: [
        { seasonNumber: 1, name: "Season 1" },
        { seasonNumber: 2, name: "Season 2" },
      ],
    })),
  };
});

// Important: import app modules AFTER mocks are registered.
const { db } = await import("@/lib/db");
const { setTestUserId } = await import("./helpers/auth-mock");

async function truncateUserData() {
  await db.execute(sql`
    TRUNCATE TABLE
      user_achievements,
      items,
      friendships,
      guild_members,
      guilds,
      accounts,
      verification_tokens,
      auth_tokens,
      users
    RESTART IDENTITY CASCADE
  `);
}

// Hobbies and achievements are seeded once per worker database in global-setup
// and are never truncated, so each test only needs the user-data reset.
beforeEach(async () => {
  await truncateUserData();
  setTestUserId(null);
});

// Hand the database back so a later file can take it.
afterAll(releaseWorkerSlot);
