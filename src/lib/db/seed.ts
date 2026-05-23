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
  category: "general" | "movies" | "tv" | "games" | "books" | "social";
  requirement: AchievementRequirement;
  sortOrder: number;
};

export const ACHIEVEMENTS: SeedAchievement[] = [
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
    slug: "movie_buff_5",
    name: "Movie Buff",
    description: "Complete 5 movies",
    icon: "film-badge",
    category: "movies",
    requirement: { type: "items_completed", count: 5, hobby: "movies" },
    sortOrder: 20,
  },
  {
    slug: "shows_5",
    name: "Bingewatcher",
    description: "Complete 5 TV seasons",
    icon: "tv-badge",
    category: "tv",
    requirement: { type: "items_completed", count: 5, hobby: "tv" },
    sortOrder: 21,
  },
  {
    slug: "gamer_5",
    name: "Gamer",
    description: "Complete 5 games",
    icon: "gamepad-badge",
    category: "games",
    requirement: { type: "items_completed", count: 5, hobby: "games" },
    sortOrder: 22,
  },
  {
    slug: "bookworm_5",
    name: "Bookworm",
    description: "Complete 5 books",
    icon: "book-badge",
    category: "books",
    requirement: { type: "items_completed", count: 5, hobby: "books" },
    sortOrder: 23,
  },
  {
    slug: "movie_buff_25",
    name: "Cinephile",
    description: "Complete 25 movies",
    icon: "reel",
    category: "movies",
    requirement: { type: "items_completed", count: 25, hobby: "movies" },
    sortOrder: 30,
  },
  {
    slug: "shows_25",
    name: "Couch Commander",
    description: "Complete 25 TV seasons",
    icon: "remote",
    category: "tv",
    requirement: { type: "items_completed", count: 25, hobby: "tv" },
    sortOrder: 31,
  },
  {
    slug: "gamer_25",
    name: "Hardcore Gamer",
    description: "Complete 25 games",
    icon: "controller-gold",
    category: "games",
    requirement: { type: "items_completed", count: 25, hobby: "games" },
    sortOrder: 32,
  },
  {
    slug: "bookworm_25",
    name: "Scholar",
    description: "Complete 25 books",
    icon: "scroll",
    category: "books",
    requirement: { type: "items_completed", count: 25, hobby: "books" },
    sortOrder: 33,
  },
  {
    slug: "well_rounded",
    name: "Well Rounded",
    description: "Complete 5+ in every hobby",
    icon: "compass",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 5 },
    sortOrder: 40,
  },
  {
    slug: "explorer",
    name: "Explorer",
    description: "Log at least 1 item in every hobby",
    icon: "map",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 1, mode: "logged" },
    sortOrder: 41,
  },
  {
    slug: "century",
    name: "Century",
    description: "Complete 100 items",
    icon: "crown",
    category: "general",
    requirement: { type: "items_completed", count: 100 },
    sortOrder: 50,
  },
  {
    slug: "dedicated",
    name: "Dedicated",
    description: "Complete 50 in any single hobby",
    icon: "flame",
    category: "general",
    requirement: { type: "items_completed", count: 50, hobby: "any" },
    sortOrder: 51,
  },
  {
    slug: "critic",
    name: "Critic",
    description: "Rate 10 items",
    icon: "stars",
    category: "general",
    requirement: { type: "items_rated", count: 10 },
    sortOrder: 60,
  },
];

export async function runSeed(): Promise<void> {
  console.log("Seeding hobbies…");
  await db
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
  await db
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
