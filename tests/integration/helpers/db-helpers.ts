import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { hobbies, users } from "@/lib/db/schema";

const PASSWORD = "int-test-pw-1234";

type CreateUserOverrides = {
  name?: string;
  username?: string;
  profileVisibility?: "public" | "friends_only" | "guild_only" | "private";
};

export type TestUser = {
  id: string;
  email: string;
  username: string;
  name: string;
};

export async function createTestUser(overrides: CreateUserOverrides = {}): Promise<TestUser> {
  const id = randomUUID();
  const username = overrides.username ?? `int-${id.slice(0, 8)}`;
  const name = overrides.name ?? `Int ${id.slice(0, 4)}`;
  const email = `${username}@int.test`;
  const passwordHash = await hashPassword(PASSWORD);

  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      username,
      passwordHash,
      profileVisibility: overrides.profileVisibility ?? "public",
    })
    .returning({ id: users.id });

  if (!user) throw new Error("Failed to create test user");
  return { id: user.id, email, username, name };
}

export async function getHobbyId(slug: "movies" | "tv" | "games" | "books"): Promise<string> {
  const [row] = await db.select({ id: hobbies.id }).from(hobbies).where(eq(hobbies.slug, slug));
  if (!row) throw new Error(`hobby ${slug} not seeded`);
  return row.id;
}

export async function fetchUser(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  return row;
}
