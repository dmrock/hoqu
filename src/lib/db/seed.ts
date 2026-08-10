import { sql } from "drizzle-orm";
import { db } from "./index";
import { type AchievementRequirement, achievements, hobbies } from "./schema";

export const HOBBIES = [
  { slug: "movies", name: "Movies", icon: "film", pointsPerItem: 1 },
  { slug: "tv", name: "TV Shows", icon: "tv", pointsPerItem: 5 },
  { slug: "games", name: "Games", icon: "gamepad", pointsPerItem: 10 },
  { slug: "books", name: "Books", icon: "book", pointsPerItem: 6 },
];

export type SeedAchievement = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: "general" | "milestones" | "ratings" | "movies" | "tv" | "games" | "books" | "social";
  requirement: AchievementRequirement;
  sortOrder: number;
};

export const ACHIEVEMENTS: SeedAchievement[] = [
  // ─── General (discovery + variety) ───────────────────────────────────────
  {
    slug: "first_step",
    name: "First Step",
    description: "Complete your first item",
    icon: "footprints",
    category: "general",
    requirement: { type: "items_completed", count: 1 },
    sortOrder: 10,
  },
  {
    slug: "explorer",
    name: "Explorer",
    description: "Log at least 1 item in every hobby",
    icon: "map",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 1, mode: "logged" },
    sortOrder: 11,
  },
  {
    slug: "well_rounded",
    name: "Well Rounded",
    description: "Complete 5+ in every hobby",
    icon: "compass",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 5 },
    sortOrder: 12,
  },
  {
    slug: "polymath",
    name: "Polymath",
    description: "Complete 25+ in every hobby",
    icon: "graduation-cap",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 25 },
    sortOrder: 13,
  },

  // ─── Milestones (cross-hobby totals + any-single-hobby) ──────────────────
  {
    slug: "century",
    name: "Century",
    description: "Complete 100 items",
    icon: "crown",
    category: "milestones",
    requirement: { type: "items_completed", count: 100 },
    sortOrder: 20,
  },
  {
    slug: "legend",
    name: "Legend",
    description: "Complete 1000 items",
    icon: "castle",
    category: "milestones",
    requirement: { type: "items_completed", count: 1000 },
    sortOrder: 21,
  },
  {
    slug: "dedicated",
    name: "Dedicated",
    description: "Complete 50 in any single hobby",
    icon: "flame",
    category: "milestones",
    requirement: { type: "items_completed", count: 50, hobby: "any" },
    sortOrder: 22,
  },
  {
    slug: "obsessed",
    name: "Obsessed",
    description: "Complete 500 in any single hobby",
    icon: "mountain",
    category: "milestones",
    requirement: { type: "items_completed", count: 500, hobby: "any" },
    sortOrder: 23,
  },

  // ─── Ratings ─────────────────────────────────────────────────────────────
  {
    slug: "critic",
    name: "Critic",
    description: "Rate 5 items",
    icon: "star",
    category: "ratings",
    requirement: { type: "items_rated", count: 5 },
    sortOrder: 30,
  },
  {
    slug: "connoisseur",
    name: "Connoisseur",
    description: "Rate 25 items",
    icon: "stars",
    category: "ratings",
    requirement: { type: "items_rated", count: 25 },
    sortOrder: 31,
  },
  {
    slug: "tastemaker",
    name: "Tastemaker",
    description: "Rate 100 items",
    icon: "badge-check",
    category: "ratings",
    requirement: { type: "items_rated", count: 100 },
    sortOrder: 32,
  },
  {
    slug: "judge",
    name: "Judge",
    description: "Rate 1000 items",
    icon: "gavel",
    category: "ratings",
    requirement: { type: "items_rated", count: 1000 },
    sortOrder: 33,
  },

  // ─── Movies ──────────────────────────────────────────────────────────────
  {
    slug: "movie_buff_5",
    name: "Movie Buff",
    description: "Complete 5 movies",
    icon: "film",
    category: "movies",
    requirement: { type: "items_completed", count: 5, hobby: "movies" },
    sortOrder: 40,
  },
  {
    slug: "movie_buff_25",
    name: "Cinephile",
    description: "Complete 25 movies",
    icon: "clapperboard",
    category: "movies",
    requirement: { type: "items_completed", count: 25, hobby: "movies" },
    sortOrder: 41,
  },
  {
    slug: "movie_buff_100",
    name: "Auteur",
    description: "Complete 100 movies",
    icon: "drama",
    category: "movies",
    requirement: { type: "items_completed", count: 100, hobby: "movies" },
    sortOrder: 42,
  },
  {
    slug: "movie_buff_1000",
    name: "Mogul",
    description: "Complete 1000 movies",
    icon: "popcorn",
    category: "movies",
    requirement: { type: "items_completed", count: 1000, hobby: "movies" },
    sortOrder: 43,
  },

  // ─── TV Shows (per season) ───────────────────────────────────────────────
  {
    slug: "shows_5",
    name: "Bingewatcher",
    description: "Complete 5 TV seasons",
    icon: "tv",
    category: "tv",
    requirement: { type: "items_completed", count: 5, hobby: "tv" },
    sortOrder: 50,
  },
  {
    slug: "shows_25",
    name: "Couch Commander",
    description: "Complete 25 TV seasons",
    icon: "tv-2",
    category: "tv",
    requirement: { type: "items_completed", count: 25, hobby: "tv" },
    sortOrder: 51,
  },
  {
    slug: "shows_100",
    name: "Showrunner",
    description: "Complete 100 TV seasons",
    icon: "monitor-play",
    category: "tv",
    requirement: { type: "items_completed", count: 100, hobby: "tv" },
    sortOrder: 52,
  },
  {
    slug: "shows_1000",
    name: "TV Titan",
    description: "Complete 1000 TV seasons",
    icon: "antenna",
    category: "tv",
    requirement: { type: "items_completed", count: 1000, hobby: "tv" },
    sortOrder: 53,
  },

  // ─── Games ───────────────────────────────────────────────────────────────
  {
    slug: "gamer_5",
    name: "Gamer",
    description: "Complete 5 games",
    icon: "gamepad",
    category: "games",
    requirement: { type: "items_completed", count: 5, hobby: "games" },
    sortOrder: 60,
  },
  {
    slug: "gamer_25",
    name: "Hardcore Gamer",
    description: "Complete 25 games",
    icon: "joystick",
    category: "games",
    requirement: { type: "items_completed", count: 25, hobby: "games" },
    sortOrder: 61,
  },
  {
    slug: "gamer_100",
    name: "Completionist",
    description: "Complete 100 games",
    icon: "target",
    category: "games",
    requirement: { type: "items_completed", count: 100, hobby: "games" },
    sortOrder: 62,
  },
  {
    slug: "gamer_1000",
    name: "Game Master",
    description: "Complete 1000 games",
    icon: "swords",
    category: "games",
    requirement: { type: "items_completed", count: 1000, hobby: "games" },
    sortOrder: 63,
  },

  // ─── Books ───────────────────────────────────────────────────────────────
  {
    slug: "bookworm_5",
    name: "Bookworm",
    description: "Complete 5 books",
    icon: "book-open",
    category: "books",
    requirement: { type: "items_completed", count: 5, hobby: "books" },
    sortOrder: 70,
  },
  {
    slug: "bookworm_25",
    name: "Scholar",
    description: "Complete 25 books",
    icon: "scroll",
    category: "books",
    requirement: { type: "items_completed", count: 25, hobby: "books" },
    sortOrder: 71,
  },
  {
    slug: "bookworm_100",
    name: "Sage",
    description: "Complete 100 books",
    icon: "library",
    category: "books",
    requirement: { type: "items_completed", count: 100, hobby: "books" },
    sortOrder: 72,
  },
  {
    slug: "bookworm_1000",
    name: "Loremaster",
    description: "Complete 1000 books",
    icon: "book-marked",
    category: "books",
    requirement: { type: "items_completed", count: 1000, hobby: "books" },
    sortOrder: 73,
  },
];

// `target` lets the integration harness seed each per-worker database; app code
// and the seed CLI use the default connection.
export async function runSeed(target: typeof db = db): Promise<void> {
  console.log("Seeding hobbies…");
  await target
    .insert(hobbies)
    .values(HOBBIES)
    .onConflictDoUpdate({
      target: hobbies.slug,
      set: {
        name: sql`excluded.name`,
        icon: sql`excluded.icon`,
        pointsPerItem: sql`excluded.points_per_item`,
      },
    });

  console.log("Seeding achievements…");
  await target
    .insert(achievements)
    .values(ACHIEVEMENTS)
    .onConflictDoUpdate({
      target: achievements.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        icon: sql`excluded.icon`,
        category: sql`excluded.category`,
        requirement: sql`excluded.requirement`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  console.log("Done.");
}
