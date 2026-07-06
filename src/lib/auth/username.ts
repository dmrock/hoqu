import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { users } from "@/lib/db/schema";

export function slugifyEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const slug = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "user";
}

/**
 * Lowest free `base` / `base-N` username. Read-only: nothing is reserved until
 * the caller writes the row, so a concurrent signup can still take the name —
 * do the write through `withUniqueUsername`.
 */
export async function generateUniqueUsername(base: string): Promise<string> {
  for (let suffix = 0; suffix < 1000; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix}`;
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique username");
}

const MAX_USERNAME_ATTEMPTS = 3;

/**
 * Run `write` with a free username for `base`, retrying with the next free
 * suffix when a concurrent signup grabs the same name between our check and
 * the write. Violations of other constraints propagate untouched.
 */
export async function withUniqueUsername<T>(
  base: string,
  write: (username: string) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const username = await generateUniqueUsername(base);
    try {
      return await write(username);
    } catch (err) {
      if (attempt >= MAX_USERNAME_ATTEMPTS || !isUniqueViolation(err, "users_username_unique")) {
        throw err;
      }
    }
  }
}
