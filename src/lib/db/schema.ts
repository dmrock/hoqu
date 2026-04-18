import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public",
  "friends_only",
  "guild_only",
  "private",
]);

export const itemStatusEnum = pgEnum("item_status", [
  "completed",
  "in_progress",
  "planned",
  "dropped",
]);

export const guildRoleEnum = pgEnum("guild_role", ["master", "officer", "member"]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "declined",
]);

export const achievementCategoryEnum = pgEnum("achievement_category", [
  "general",
  "movies",
  "games",
  "books",
  "social",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  username: text("username").notNull().unique(),
  nickname: text("nickname"),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  totalPoints: integer("total_points").notNull().default(0),
  moviesCompleted: integer("movies_completed").notNull().default(0),
  gamesCompleted: integer("games_completed").notNull().default(0),
  booksCompleted: integer("books_completed").notNull().default(0),
  itemsRated: integer("items_rated").notNull().default(0),
  profileVisibility: profileVisibilityEnum("profile_visibility").notNull().default("public"),
  discordUsername: text("discord_username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const hobbies = pgTable("hobbies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  pointsPerItem: integer("points_per_item").notNull().default(1),
});

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hobbyId: uuid("hobby_id")
      .notNull()
      .references(() => hobbies.id),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    year: integer("year"),
    externalRating: real("external_rating"),
    userRating: integer("user_rating"),
    note: text("note"),
    wouldRevisit: boolean("would_revisit").notNull().default(false),
    status: itemStatusEnum("status").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("items_user_hobby_external_unique").on(t.userId, t.hobbyId, t.externalId)],
);

export const guilds = pgTable("guilds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconUrl: text("icon_url"),
  inviteCode: text("invite_code").notNull().unique(),
  discordInviteUrl: text("discord_invite_url"),
  maxMembers: integer("max_members").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guildMembers = pgTable(
  "guild_members",
  {
    guildId: uuid("guild_id")
      .notNull()
      .references(() => guilds.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: guildRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.userId] })],
);

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addresseeId: uuid("addressee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: friendshipStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AchievementRequirement =
  | { type: "items_completed"; count: number; hobby?: string }
  | { type: "all_hobbies"; min_per_hobby: number }
  | { type: "items_rated"; count: number };

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: achievementCategoryEnum("category").notNull(),
  requirement: jsonb("requirement").$type<AchievementRequirement>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);
