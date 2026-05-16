import { sql } from "drizzle-orm";
import { hashPassword } from "../../src/lib/auth/password";
import { db } from "../../src/lib/db";
import { users } from "../../src/lib/db/schema";
import { runSeed } from "../../src/lib/db/seed";
import { USER_A, USER_B, USER_PASSWORD } from "../fixtures/users";

export default async function globalSetup() {
  console.log("[e2e] truncating user-data tables…");
  await db.execute(sql`
    TRUNCATE TABLE
      user_achievements,
      items,
      friendships,
      guild_members,
      guilds,
      accounts,
      verification_tokens,
      users
    RESTART IDENTITY CASCADE
  `);

  await runSeed();

  console.log("[e2e] creating test users…");
  const passwordHash = await hashPassword(USER_PASSWORD);
  await db.insert(users).values([
    {
      email: USER_A.email,
      name: USER_A.name,
      username: USER_A.username,
      passwordHash,
    },
    {
      email: USER_B.email,
      name: USER_B.name,
      username: USER_B.username,
      passwordHash,
    },
  ]);

  console.log("[e2e] global setup complete.");
}
