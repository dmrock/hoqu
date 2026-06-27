import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  loadFriendsActivity,
  loadGuildActivity,
  loadOwnedExternalIds,
} from "@/lib/activity-queries";
import { db } from "@/lib/db";
import { friendships, guildMembers, guilds, items } from "@/lib/db/schema";
import { createTestUser, getHobbyId } from "./helpers/db-helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

async function befriend(aId: string, bId: string) {
  await db.insert(friendships).values({
    requesterId: aId,
    addresseeId: bId,
    status: "accepted",
  });
}

type ItemStatus = "completed" | "in_progress" | "planned" | "dropped";

async function addItemRow(opts: {
  userId: string;
  hobbyId: string;
  externalId: string;
  title: string;
  userRating?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  parentItemId?: string | null;
  status?: ItemStatus | null;
}): Promise<string> {
  const createdAt = opts.createdAt ?? new Date();
  const [row] = await db
    .insert(items)
    .values({
      userId: opts.userId,
      hobbyId: opts.hobbyId,
      externalId: opts.externalId,
      title: opts.title,
      status: opts.status === undefined ? "completed" : opts.status,
      userRating: opts.userRating ?? null,
      createdAt,
      // Mirrors prod: updatedAt defaults to createdAt and only moves forward on edits.
      updatedAt: opts.updatedAt ?? createdAt,
      parentItemId: opts.parentItemId ?? null,
    })
    .returning({ id: items.id });
  if (!row) throw new Error("failed to insert item");
  return row.id;
}

async function createGuildWith(memberIds: string[]): Promise<string> {
  const [guild] = await db
    .insert(guilds)
    .values({
      name: `Guild ${randomUUID().slice(0, 8)}`,
      inviteCode: randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase(),
    })
    .returning({ id: guilds.id });
  if (!guild) throw new Error("failed to insert guild");
  await db.insert(guildMembers).values(
    memberIds.map((userId, i) => ({
      guildId: guild.id,
      userId,
      role: i === 0 ? ("master" as const) : ("member" as const),
    })),
  );
  return guild.id;
}

describe("loadFriendsActivity", () => {
  it("dedups a shared item and ranks by combined rate × popularity", async () => {
    const viewer = await createTestUser();
    const [f1, f2, f3] = await Promise.all([createTestUser(), createTestUser(), createTestUser()]);
    await Promise.all([
      befriend(viewer.id, f1.id),
      befriend(viewer.id, f2.id),
      befriend(viewer.id, f3.id),
    ]);
    const movies = await getHobbyId("movies");

    // A: avg 8 across 3 adders → 8 × ln(4) ≈ 11.1
    await addItemRow({
      userId: f1.id,
      hobbyId: movies,
      externalId: "A",
      title: "A",
      userRating: 6,
    });
    await addItemRow({
      userId: f2.id,
      hobbyId: movies,
      externalId: "A",
      title: "A",
      userRating: 8,
    });
    await addItemRow({
      userId: f3.id,
      hobbyId: movies,
      externalId: "A",
      title: "A",
      userRating: 10,
    });
    // B: 10 × ln(2) ≈ 6.9
    await addItemRow({
      userId: f1.id,
      hobbyId: movies,
      externalId: "B",
      title: "B",
      userRating: 10,
    });
    // C: unrated → 0
    await addItemRow({ userId: f1.id, hobbyId: movies, externalId: "C", title: "C" });
    await addItemRow({ userId: f2.id, hobbyId: movies, externalId: "C", title: "C" });

    const data = await loadFriendsActivity(viewer.id, false);

    expect(data.movies.map((m) => m.externalId)).toEqual(["A", "B", "C"]);
    const [a, b, c] = data.movies;
    expect(a?.combinedRate).toBe(8);
    expect(a?.peopleCount).toBe(3);
    expect(b?.combinedRate).toBe(10);
    expect(b?.peopleCount).toBe(1);
    expect(c?.combinedRate).toBeNull();
    expect(c?.peopleCount).toBe(2);
  });

  it("excludes the viewer's own items unless includeSelf is set", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    await addItemRow({
      userId: viewer.id,
      hobbyId: movies,
      externalId: "V",
      title: "V",
      userRating: 9,
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "F",
      title: "F",
      userRating: 7,
    });

    const others = await loadFriendsActivity(viewer.id, false);
    expect(others.movies.map((m) => m.externalId)).toEqual(["F"]);

    const withMine = await loadFriendsActivity(viewer.id, true);
    expect(withMine.movies.map((m) => m.externalId).sort()).toEqual(["F", "V"]);
  });

  it("folds the viewer's rating into a shared item when includeSelf is set", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "S",
      title: "S",
      userRating: 6,
    });
    await addItemRow({
      userId: viewer.id,
      hobbyId: movies,
      externalId: "S",
      title: "S",
      userRating: 10,
    });

    const others = await loadFriendsActivity(viewer.id, false);
    expect(others.movies[0]?.combinedRate).toBe(6);
    expect(others.movies[0]?.peopleCount).toBe(1);

    const withMine = await loadFriendsActivity(viewer.id, true);
    expect(withMine.movies[0]?.combinedRate).toBe(8);
    expect(withMine.movies[0]?.peopleCount).toBe(2);
  });

  it("excludes non-friends", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    const stranger = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    await addItemRow({
      userId: stranger.id,
      hobbyId: movies,
      externalId: "X",
      title: "X",
      userRating: 10,
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "Y",
      title: "Y",
      userRating: 5,
    });

    const data = await loadFriendsActivity(viewer.id, true);
    expect(data.movies.map((m) => m.externalId)).toEqual(["Y"]);
  });

  it("excludes items added more than 30 days ago", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "OLD",
      title: "Old",
      userRating: 10,
      createdAt: new Date(Date.now() - 40 * DAY_MS),
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "NEW",
      title: "New",
      userRating: 5,
    });

    const data = await loadFriendsActivity(viewer.id, false);
    expect(data.movies.map((m) => m.externalId)).toEqual(["NEW"]);
  });

  it("surfaces an old item that was recently updated (e.g. planned → in_progress)", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    // Added 45 days ago, but its status changed today → updatedAt is recent.
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "REVIVED",
      title: "Revived",
      userRating: 8,
      status: "in_progress",
      createdAt: new Date(Date.now() - 45 * DAY_MS),
      updatedAt: new Date(),
    });

    const data = await loadFriendsActivity(viewer.id, false);
    expect(data.movies.map((m) => m.externalId)).toEqual(["REVIVED"]);
  });

  it("represents a multi-season TV show via its seasons (rating + show metadata)", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const tv = await getHobbyId("tv");

    // Multi-season show: parent holds the title but a null status/rating; the seasons
    // carry the user's progress and rating.
    const parentId = await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "show1",
      title: "Show 1",
      status: null,
      userRating: null,
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "show1:s1",
      title: "Season 1",
      status: "completed",
      userRating: 8,
      parentItemId: parentId,
    });
    // A planned future season must neither count nor dilute the rating.
    await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "show1:s2",
      title: "Season 2",
      status: "planned",
      userRating: null,
      parentItemId: parentId,
    });

    const data = await loadFriendsActivity(viewer.id, false);
    expect(data.tv).toHaveLength(1);
    expect(data.tv[0]?.externalId).toBe("show1");
    expect(data.tv[0]?.title).toBe("Show 1"); // the show, not "Season 1"
    expect(data.tv[0]?.combinedRate).toBe(8); // from the rated season
    expect(data.tv[0]?.peopleCount).toBe(1);
  });

  it("keeps an old multi-season show in the window when a season is watched recently", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const tv = await getHobbyId("tv");

    const longAgo = new Date(Date.now() - 50 * DAY_MS);
    const parentId = await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "oldshow",
      title: "Old Show",
      status: null,
      userRating: null,
      createdAt: longAgo,
      updatedAt: longAgo,
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "oldshow:s1",
      title: "Season 1",
      status: "in_progress",
      userRating: 9,
      parentItemId: parentId,
      createdAt: longAgo,
      updatedAt: new Date(),
    });

    const data = await loadFriendsActivity(viewer.id, false);
    expect(data.tv.map((m) => m.externalId)).toEqual(["oldshow"]);
  });

  it("excludes a multi-season show whose seasons are all planned", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const tv = await getHobbyId("tv");

    const parentId = await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "future",
      title: "Future Show",
      status: null,
      userRating: null,
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: tv,
      externalId: "future:s1",
      title: "Season 1",
      status: "planned",
      userRating: null,
      parentItemId: parentId,
    });

    const data = await loadFriendsActivity(viewer.id, false);
    expect(data.tv).toHaveLength(0);
  });

  it("excludes planned and dropped items but keeps in_progress and completed", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "P",
      title: "P",
      userRating: 10,
      status: "planned",
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "D",
      title: "D",
      userRating: 9,
      status: "dropped",
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "IP",
      title: "IP",
      userRating: 8,
      status: "in_progress",
    });
    await addItemRow({
      userId: friend.id,
      hobbyId: movies,
      externalId: "C",
      title: "C",
      userRating: 7,
      status: "completed",
    });

    const data = await loadFriendsActivity(viewer.id, false);
    // P (planned) and D (dropped) are gone; IP outranks C on rating.
    expect(data.movies.map((m) => m.externalId)).toEqual(["IP", "C"]);
  });

  it("caps each category at 3 items", async () => {
    const viewer = await createTestUser();
    const friend = await createTestUser();
    await befriend(viewer.id, friend.id);
    const movies = await getHobbyId("movies");

    for (let i = 1; i <= 5; i++) {
      await addItemRow({
        userId: friend.id,
        hobbyId: movies,
        externalId: `m${i}`,
        title: `m${i}`,
        userRating: 5 + i, // 6..10
      });
    }

    const data = await loadFriendsActivity(viewer.id, false);
    expect(data.movies).toHaveLength(3);
    // Only the three highest-rated survive (m5/m4/m3); m1 falls off.
    expect(data.movies.map((m) => m.externalId)).toEqual(["m5", "m4", "m3"]);
  });
});

describe("loadGuildActivity", () => {
  it("returns members' items, excluding the viewer and non-members", async () => {
    const viewer = await createTestUser();
    const member = await createTestUser();
    const outsider = await createTestUser();
    const guildId = await createGuildWith([viewer.id, member.id]);
    const movies = await getHobbyId("movies");

    await addItemRow({
      userId: member.id,
      hobbyId: movies,
      externalId: "M",
      title: "M",
      userRating: 8,
    });
    await addItemRow({
      userId: viewer.id,
      hobbyId: movies,
      externalId: "VG",
      title: "VG",
      userRating: 9,
    });
    await addItemRow({
      userId: outsider.id,
      hobbyId: movies,
      externalId: "O",
      title: "O",
      userRating: 10,
    });

    const others = await loadGuildActivity(guildId, viewer.id, false);
    expect(others.movies.map((m) => m.externalId)).toEqual(["M"]);

    const withMine = await loadGuildActivity(guildId, viewer.id, true);
    expect(withMine.movies.map((m) => m.externalId).sort()).toEqual(["M", "VG"]);
  });
});

describe("loadOwnedExternalIds", () => {
  it("groups the user's externalIds by hobby (any status) and filters to requested slugs", async () => {
    const viewer = await createTestUser();
    const other = await createTestUser();
    const [movies, games, books] = await Promise.all([
      getHobbyId("movies"),
      getHobbyId("games"),
      getHobbyId("books"),
    ]);

    await addItemRow({ userId: viewer.id, hobbyId: movies, externalId: "m1", title: "m1" });
    // Ownership is status-agnostic: a planned item still blocks re-adding from a feed.
    await addItemRow({
      userId: viewer.id,
      hobbyId: movies,
      externalId: "m2",
      title: "m2",
      status: "planned",
    });
    await addItemRow({ userId: viewer.id, hobbyId: games, externalId: "g1", title: "g1" });
    await addItemRow({ userId: viewer.id, hobbyId: books, externalId: "b1", title: "b1" });
    // Another user's item must not leak in.
    await addItemRow({ userId: other.id, hobbyId: movies, externalId: "x", title: "x" });

    const owned = await loadOwnedExternalIds(viewer.id, ["movies", "games"]);

    expect(owned.movies.sort()).toEqual(["m1", "m2"]);
    expect(owned.games).toEqual(["g1"]);
    // books was owned but not requested → stays empty; tv had nothing.
    expect(owned.books).toEqual([]);
    expect(owned.tv).toEqual([]);
  });

  it("maps a multi-season show to the show's externalId and ignores season children", async () => {
    const viewer = await createTestUser();
    const tv = await getHobbyId("tv");

    const parentId = await addItemRow({
      userId: viewer.id,
      hobbyId: tv,
      externalId: "show1",
      title: "Show 1",
      status: null,
    });
    await addItemRow({
      userId: viewer.id,
      hobbyId: tv,
      externalId: "show1:s1",
      title: "Season 1",
      status: "completed",
      parentItemId: parentId,
    });
    await addItemRow({
      userId: viewer.id,
      hobbyId: tv,
      externalId: "show1:s2",
      title: "Season 2",
      status: "planned",
      parentItemId: parentId,
    });

    const owned = await loadOwnedExternalIds(viewer.id, ["tv"]);

    // Only the parent's externalId — what the trending feed surfaces — not the
    // season children's "show1:s1"/"show1:s2".
    expect(owned.tv).toEqual(["show1"]);
  });

  it("returns all-empty buckets when no slugs are requested", async () => {
    const viewer = await createTestUser();
    const movies = await getHobbyId("movies");
    await addItemRow({ userId: viewer.id, hobbyId: movies, externalId: "m1", title: "m1" });

    const owned = await loadOwnedExternalIds(viewer.id, []);
    expect(owned).toEqual({ movies: [], tv: [], games: [], books: [] });
  });
});
