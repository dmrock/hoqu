import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { guildMembers, guilds, users } from "./db/schema";

export type GuildRole = "master" | "officer" | "member";

const INVITE_CODE_CHARS = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"; // skip 0/O/1/I to avoid confusion
const INVITE_CODE_LENGTH = 8;

/** Cryptographically random 8-char alphanumeric invite code (uppercase). */
export function generateInviteCode(): string {
  const buf = randomBytes(INVITE_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    const byte = buf[i] ?? 0;
    out += INVITE_CODE_CHARS[byte % INVITE_CODE_CHARS.length];
  }
  return out;
}

export type UserGuildSummary = {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  role: GuildRole;
  memberCount: number;
};

/** Guilds the user belongs to, joined with their role and member count. */
export async function loadUserGuilds(userId: string): Promise<UserGuildSummary[]> {
  const memberRows = await db
    .select({
      id: guilds.id,
      name: guilds.name,
      description: guilds.description,
      iconUrl: guilds.iconUrl,
      role: guildMembers.role,
    })
    .from(guildMembers)
    .innerJoin(guilds, eq(guildMembers.guildId, guilds.id))
    .where(eq(guildMembers.userId, userId))
    .orderBy(asc(guilds.name));

  if (memberRows.length === 0) return [];

  const counts = await db
    .select({
      guildId: guildMembers.guildId,
      count: sql<number>`count(*)::int`,
    })
    .from(guildMembers)
    .where(
      inArray(
        guildMembers.guildId,
        memberRows.map((r) => r.id),
      ),
    )
    .groupBy(guildMembers.guildId);
  const countMap = new Map(counts.map((c) => [c.guildId, c.count]));

  return memberRows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    iconUrl: r.iconUrl,
    role: r.role as GuildRole,
    memberCount: countMap.get(r.id) ?? 0,
  }));
}

export type GuildMembership = {
  guild: {
    id: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    inviteCode: string;
    discordInviteUrl: string | null;
    maxMembers: number;
    createdAt: Date;
  };
  viewerRole: GuildRole | null;
};

/** Load a guild row + the viewer's role within it (or null if not a member). */
export async function getGuildWithMembership(
  guildId: string,
  viewerId: string,
): Promise<GuildMembership | null> {
  const [guild] = await db
    .select({
      id: guilds.id,
      name: guilds.name,
      description: guilds.description,
      iconUrl: guilds.iconUrl,
      inviteCode: guilds.inviteCode,
      discordInviteUrl: guilds.discordInviteUrl,
      maxMembers: guilds.maxMembers,
      createdAt: guilds.createdAt,
    })
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1);
  if (!guild) return null;

  const [member] = await db
    .select({ role: guildMembers.role })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, viewerId)))
    .limit(1);

  return {
    guild,
    viewerRole: (member?.role as GuildRole | undefined) ?? null,
  };
}

export type GuildMemberRow = {
  userId: string;
  role: GuildRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

const ROLE_RANK: Record<GuildRole, number> = { master: 0, officer: 1, member: 2 };

/** Members of a guild with their joined user profile. Sorted by role, then name. */
export async function getGuildMembers(guildId: string): Promise<GuildMemberRow[]> {
  const rows = await db
    .select({
      userId: guildMembers.userId,
      role: guildMembers.role,
      joinedAt: guildMembers.joinedAt,
      userIdAlias: users.id,
      userName: users.name,
      userUsername: users.username,
      userImage: users.image,
    })
    .from(guildMembers)
    .innerJoin(users, eq(guildMembers.userId, users.id))
    .where(eq(guildMembers.guildId, guildId));

  return rows
    .map((r) => ({
      userId: r.userId,
      role: r.role as GuildRole,
      joinedAt: r.joinedAt,
      user: {
        id: r.userIdAlias,
        name: r.userName,
        username: r.userUsername,
        image: r.userImage,
      },
    }))
    .sort((a, b) => {
      const rank = ROLE_RANK[a.role] - ROLE_RANK[b.role];
      if (rank !== 0) return rank;
      const an = (a.user.name ?? a.user.username ?? "").toLowerCase();
      const bn = (b.user.name ?? b.user.username ?? "").toLowerCase();
      return an.localeCompare(bn);
    });
}

/**
 * Authorization check: returns the viewer's role in the guild if it's in the
 * `allowed` set, else null. Callers supply their own error message so the UX
 * stays specific (e.g. "Only the master can rotate the invite code").
 */
export async function requireGuildRole(
  viewerId: string,
  guildId: string,
  allowed: GuildRole[],
): Promise<GuildRole | null> {
  const [viewer] = await db
    .select({ role: guildMembers.role })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, viewerId)))
    .limit(1);
  if (!viewer) return null;
  const role = viewer.role as GuildRole;
  return allowed.includes(role) ? role : null;
}

/** Whether two users share at least one guild. Used for guild_only visibility. */
export async function shareGuild(viewerId: string, otherUserId: string): Promise<boolean> {
  if (viewerId === otherUserId) return false;
  const viewerGuilds = db
    .select({ guildId: guildMembers.guildId })
    .from(guildMembers)
    .where(eq(guildMembers.userId, viewerId));
  const [hit] = await db
    .select({ guildId: guildMembers.guildId })
    .from(guildMembers)
    .where(and(eq(guildMembers.userId, otherUserId), inArray(guildMembers.guildId, viewerGuilds)))
    .limit(1);
  return !!hit;
}
