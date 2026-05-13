"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { guildMembers, guilds } from "@/lib/db/schema";
import { generateInviteCode, requireGuildRole } from "@/lib/guilds";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const nameSchema = z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters")
  .max(50, "Name must be at most 50 characters");
const descriptionSchema = z
  .string()
  .trim()
  .max(300, "Description must be at most 300 characters")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));
const discordSchema = z
  .string()
  .trim()
  .url("Discord URL must be a valid URL")
  .max(200)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null));

const createGuildSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  discordInviteUrl: discordSchema,
});

const joinSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter an invite code")
    .max(16)
    .transform((s) => s.toUpperCase()),
});

const guildIdSchema = z.object({ guildId: z.uuid() });
const memberActionSchema = z.object({ guildId: z.uuid(), memberUserId: z.uuid() });
const updateSchema = z.object({
  guildId: z.uuid(),
  description: descriptionSchema,
  discordInviteUrl: discordSchema,
});

export type CreateGuildInput = z.input<typeof createGuildSchema>;
export type UpdateGuildInput = z.input<typeof updateSchema>;

async function generateUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const [existing] = await db
      .select({ id: guilds.id })
      .from(guilds)
      .where(eq(guilds.inviteCode, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique invite code");
}

export async function createGuild(
  input: CreateGuildInput,
): Promise<ActionResult<{ guildId: string }>> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = createGuildSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const userId = session.userId;

  const [nameClash] = await db
    .select({ id: guilds.id })
    .from(guilds)
    .where(eq(guilds.name, data.name))
    .limit(1);
  if (nameClash) return { ok: false, error: "A guild with that name already exists" };

  const code = await generateUniqueInviteCode();
  const [guild] = await db
    .insert(guilds)
    .values({
      name: data.name,
      description: data.description,
      discordInviteUrl: data.discordInviteUrl,
      inviteCode: code,
    })
    .returning({ id: guilds.id });

  await db.insert(guildMembers).values({
    guildId: guild.id,
    userId,
    role: "master",
  });

  revalidatePath("/guilds");
  return { ok: true, data: { guildId: guild.id } };
}

export async function joinGuildByCode(input: {
  code: string;
}): Promise<ActionResult<{ guildId: string }>> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const userId = session.userId;
  const code = parsed.data.code;

  const [guild] = await db
    .select({ id: guilds.id, maxMembers: guilds.maxMembers })
    .from(guilds)
    .where(eq(guilds.inviteCode, code))
    .limit(1);
  if (!guild) return { ok: false, error: "Invite code not found" };

  const [existing] = await db
    .select({ userId: guildMembers.userId })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guild.id), eq(guildMembers.userId, userId)))
    .limit(1);
  if (existing) return { ok: false, error: "You're already a member of this guild" };

  const memberCount = await db.$count(guildMembers, eq(guildMembers.guildId, guild.id));
  if (memberCount >= guild.maxMembers) {
    return { ok: false, error: "This guild is full" };
  }

  await db.insert(guildMembers).values({
    guildId: guild.id,
    userId,
    role: "member",
  });

  revalidatePath("/guilds");
  revalidatePath(`/guilds/${guild.id}`);
  return { ok: true, data: { guildId: guild.id } };
}

export async function leaveGuild(input: { guildId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = guildIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const userId = session.userId;
  const { guildId } = parsed.data;

  const role = await requireGuildRole(userId, guildId, ["master", "officer", "member"]);
  if (!role) return { ok: false, error: "You're not a member of this guild" };

  if (role === "master") {
    const otherCount = await db.$count(
      guildMembers,
      and(eq(guildMembers.guildId, guildId), ne(guildMembers.userId, userId)),
    );
    if (otherCount > 0) {
      return {
        ok: false,
        error: "Transfer ownership before leaving — you're the last master.",
      };
    }
    // Master is the last member: deleting the guild cascades the membership row.
    await db.delete(guilds).where(eq(guilds.id, guildId));
    revalidatePath("/guilds");
    return { ok: true };
  }

  await db
    .delete(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, userId)));
  revalidatePath("/guilds");
  revalidatePath(`/guilds/${guildId}`);
  return { ok: true };
}

export async function kickMember(input: {
  guildId: string;
  memberUserId: string;
}): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = memberActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const viewerId = session.userId;
  const { guildId, memberUserId } = parsed.data;
  if (viewerId === memberUserId) return { ok: false, error: "Use Leave to remove yourself" };

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master", "officer"]);
  if (!viewerRole) return { ok: false, error: "Only masters and officers can kick" };

  const [target] = await db
    .select({ role: guildMembers.role })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, memberUserId)))
    .limit(1);
  if (!target) return { ok: false, error: "Member not found" };
  if (target.role === "master") return { ok: false, error: "You can't kick the master" };
  if (viewerRole === "officer" && target.role === "officer") {
    return { ok: false, error: "Officers can only kick members" };
  }

  await db
    .delete(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, memberUserId)));
  revalidatePath(`/guilds/${guildId}`);
  return { ok: true };
}

export async function promoteMember(input: {
  guildId: string;
  memberUserId: string;
}): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = memberActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const viewerId = session.userId;
  const { guildId, memberUserId } = parsed.data;

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master"]);
  if (!viewerRole) return { ok: false, error: "Only the master can promote" };

  const result = await db
    .update(guildMembers)
    .set({ role: "officer" })
    .where(
      and(
        eq(guildMembers.guildId, guildId),
        eq(guildMembers.userId, memberUserId),
        eq(guildMembers.role, "member"),
      ),
    )
    .returning({ userId: guildMembers.userId });
  if (result.length === 0) return { ok: false, error: "Member not eligible to promote" };

  revalidatePath(`/guilds/${guildId}`);
  return { ok: true };
}

export async function demoteMember(input: {
  guildId: string;
  memberUserId: string;
}): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = memberActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const viewerId = session.userId;
  const { guildId, memberUserId } = parsed.data;

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master"]);
  if (!viewerRole) return { ok: false, error: "Only the master can demote" };

  const result = await db
    .update(guildMembers)
    .set({ role: "member" })
    .where(
      and(
        eq(guildMembers.guildId, guildId),
        eq(guildMembers.userId, memberUserId),
        eq(guildMembers.role, "officer"),
      ),
    )
    .returning({ userId: guildMembers.userId });
  if (result.length === 0) return { ok: false, error: "Member not eligible to demote" };

  revalidatePath(`/guilds/${guildId}`);
  return { ok: true };
}

export async function transferOwnership(input: {
  guildId: string;
  memberUserId: string;
}): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = memberActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const viewerId = session.userId;
  const { guildId, memberUserId } = parsed.data;
  if (viewerId === memberUserId) return { ok: false, error: "You're already the master" };

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master"]);
  if (!viewerRole) return { ok: false, error: "Only the current master can transfer" };

  const [target] = await db
    .select({ role: guildMembers.role })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, memberUserId)))
    .limit(1);
  if (!target) return { ok: false, error: "Target is not a member" };

  await db.batch([
    db
      .update(guildMembers)
      .set({ role: "officer" })
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, viewerId))),
    db
      .update(guildMembers)
      .set({ role: "master" })
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, memberUserId))),
  ]);

  revalidatePath(`/guilds/${guildId}`);
  return { ok: true };
}

export async function updateGuild(input: UpdateGuildInput): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const viewerId = session.userId;
  const { guildId, description, discordInviteUrl } = parsed.data;

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master", "officer"]);
  if (!viewerRole) return { ok: false, error: "Only masters and officers can edit" };

  await db
    .update(guilds)
    .set({ description, discordInviteUrl, updatedAt: new Date() })
    .where(eq(guilds.id, guildId));

  revalidatePath(`/guilds/${guildId}`);
  revalidatePath(`/guilds/${guildId}/settings`);
  return { ok: true };
}

export async function rotateInviteCode(input: {
  guildId: string;
}): Promise<ActionResult<{ inviteCode: string }>> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = guildIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const viewerId = session.userId;
  const { guildId } = parsed.data;

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master"]);
  if (!viewerRole) return { ok: false, error: "Only the master can rotate the invite code" };

  const code = await generateUniqueInviteCode();
  await db
    .update(guilds)
    .set({ inviteCode: code, updatedAt: new Date() })
    .where(eq(guilds.id, guildId));

  revalidatePath(`/guilds/${guildId}`);
  revalidatePath(`/guilds/${guildId}/settings`);
  return { ok: true, data: { inviteCode: code } };
}

export async function deleteGuild(input: { guildId: string }): Promise<ActionResult> {
  const session = await requireUserId();
  if (!session.ok) return session;

  const parsed = guildIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const viewerId = session.userId;
  const { guildId } = parsed.data;

  const viewerRole = await requireGuildRole(viewerId, guildId, ["master"]);
  if (!viewerRole) return { ok: false, error: "Only the master can delete the guild" };

  await db.delete(guilds).where(eq(guilds.id, guildId));
  revalidatePath("/guilds");
  return { ok: true };
}
