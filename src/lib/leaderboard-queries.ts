import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { guildMembers, users } from "./db/schema";
import { getAcceptedFriendIds } from "./friendships";
import type { LeaderboardRow } from "./leaderboards";

const ROW_COLUMNS = {
  id: users.id,
  name: users.name,
  username: users.username,
  image: users.image,
  totalPoints: users.totalPoints,
  moviesCompleted: users.moviesCompleted,
  showsCompleted: users.showsCompleted,
  gamesCompleted: users.gamesCompleted,
  booksCompleted: users.booksCompleted,
} as const;

type RawRow = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  totalPoints: number;
  moviesCompleted: number;
  showsCompleted: number;
  gamesCompleted: number;
  booksCompleted: number;
};

function toRow(r: RawRow): LeaderboardRow {
  return {
    user: { id: r.id, name: r.name, username: r.username, image: r.image },
    totalPoints: r.totalPoints,
    moviesCompleted: r.moviesCompleted,
    showsCompleted: r.showsCompleted,
    gamesCompleted: r.gamesCompleted,
    booksCompleted: r.booksCompleted,
  };
}

/**
 * Viewer + accepted friends, joined with each user's denormalized counters.
 * Both directions of the friendship row are considered.
 */
export async function loadFriendsLeaderboard(viewerId: string): Promise<LeaderboardRow[]> {
  const friendIds = await getAcceptedFriendIds(viewerId);
  const userIds = [viewerId, ...friendIds];

  const rows = await db.select(ROW_COLUMNS).from(users).where(inArray(users.id, userIds));

  return rows.map(toRow);
}

/**
 * All members of a guild, joined with their denormalized counters.
 * Caller is responsible for verifying the viewer is a member.
 */
export async function loadGuildLeaderboard(guildId: string): Promise<LeaderboardRow[]> {
  const rows = await db
    .select(ROW_COLUMNS)
    .from(guildMembers)
    .innerJoin(users, eq(guildMembers.userId, users.id))
    .where(eq(guildMembers.guildId, guildId));

  return rows.map(toRow);
}
