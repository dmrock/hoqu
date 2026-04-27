"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, or dashes")
  .transform((s) => s.toLowerCase());

const nameSchema = z
  .string()
  .trim()
  .min(1, "Display name can't be empty")
  .max(50, "Display name must be at most 50 characters");

const updateProfileSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileResult =
  | { ok: true; username: string }
  | { ok: false; error: string; field?: "name" | "username" };

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: field === "name" || field === "username" ? field : undefined,
    };
  }

  const userId = session.user.id;
  const data = parsed.data;

  const [collision] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, data.username), ne(users.id, userId)))
    .limit(1);
  if (collision) {
    return { ok: false, error: "That username is taken", field: "username" };
  }

  await db
    .update(users)
    .set({ name: data.name, username: data.username, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath(`/profile/${data.username}`);
  return { ok: true, username: data.username };
}
