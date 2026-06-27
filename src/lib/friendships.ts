import { and, eq, or } from "drizzle-orm";
import { db } from "./db";
import { friendships, users } from "./db/schema";

export type FriendshipStatus = "none" | "pending_incoming" | "pending_outgoing" | "friends";

/**
 * Look up a user's relationship to another user. Checks both directions of the
 * friendship row so we can tell whether the viewer was the requester or addressee.
 */
export async function getFriendshipStatus(
  viewerId: string,
  otherUserId: string,
): Promise<{ status: FriendshipStatus; friendshipId: string | null }> {
  if (viewerId === otherUserId) return { status: "none", friendshipId: null };

  const [row] = await db
    .select({
      id: friendships.id,
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
      status: friendships.status,
    })
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, viewerId), eq(friendships.addresseeId, otherUserId)),
        and(eq(friendships.requesterId, otherUserId), eq(friendships.addresseeId, viewerId)),
      ),
    )
    .limit(1);

  if (!row) return { status: "none", friendshipId: null };

  if (row.status === "accepted") {
    return { status: "friends", friendshipId: row.id };
  }
  if (row.status === "pending") {
    return {
      status: row.requesterId === viewerId ? "pending_outgoing" : "pending_incoming",
      friendshipId: row.id,
    };
  }
  // Treat declined the same as no relationship for now; the requester can re-send.
  return { status: "none", friendshipId: null };
}

/**
 * Count the viewer's pending INCOMING requests (they are the addressee). Same
 * "incoming = addressee + pending" semantics as getFriendshipStatus /
 * loadFriendships, used to badge the Friends nav item.
 */
export async function countIncomingRequests(userId: string): Promise<number> {
  return db.$count(
    friendships,
    and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")),
  );
}

/** IDs of the viewer's accepted friends (checking both directions), viewer excluded. */
export async function getAcceptedFriendIds(viewerId: string): Promise<string[]> {
  const rows = await db
    .select({
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
    })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, viewerId), eq(friendships.addresseeId, viewerId)),
      ),
    );

  return rows.map((r) => (r.requesterId === viewerId ? r.addresseeId : r.requesterId));
}

export type FriendListEntry = {
  friendshipId: string;
  status: "friends" | "pending_incoming" | "pending_outgoing";
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  createdAt: Date;
};

/**
 * Load all friendships involving a user, joining the OTHER party's profile fields.
 * Two queries (one per direction) since the joined column flips with the role,
 * then merged + classified in JS.
 */
export async function loadFriendships(userId: string): Promise<FriendListEntry[]> {
  const [outgoing, incoming] = await Promise.all([
    db
      .select({
        friendshipId: friendships.id,
        status: friendships.status,
        createdAt: friendships.createdAt,
        userId: users.id,
        userName: users.name,
        userUsername: users.username,
        userImage: users.image,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.addresseeId, users.id))
      .where(eq(friendships.requesterId, userId)),
    db
      .select({
        friendshipId: friendships.id,
        status: friendships.status,
        createdAt: friendships.createdAt,
        userId: users.id,
        userName: users.name,
        userUsername: users.username,
        userImage: users.image,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.requesterId, users.id))
      .where(eq(friendships.addresseeId, userId)),
  ]);

  const entries: FriendListEntry[] = [];
  for (const row of outgoing) {
    if (row.status === "accepted") {
      entries.push({
        friendshipId: row.friendshipId,
        status: "friends",
        user: {
          id: row.userId,
          name: row.userName,
          username: row.userUsername,
          image: row.userImage,
        },
        createdAt: row.createdAt,
      });
    } else if (row.status === "pending") {
      entries.push({
        friendshipId: row.friendshipId,
        status: "pending_outgoing",
        user: {
          id: row.userId,
          name: row.userName,
          username: row.userUsername,
          image: row.userImage,
        },
        createdAt: row.createdAt,
      });
    }
  }
  for (const row of incoming) {
    if (row.status === "accepted") {
      entries.push({
        friendshipId: row.friendshipId,
        status: "friends",
        user: {
          id: row.userId,
          name: row.userName,
          username: row.userUsername,
          image: row.userImage,
        },
        createdAt: row.createdAt,
      });
    } else if (row.status === "pending") {
      entries.push({
        friendshipId: row.friendshipId,
        status: "pending_incoming",
        user: {
          id: row.userId,
          name: row.userName,
          username: row.userUsername,
          image: row.userImage,
        },
        createdAt: row.createdAt,
      });
    }
  }

  return entries;
}
