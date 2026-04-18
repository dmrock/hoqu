import { config } from "dotenv";
import type { AchievementRequirement } from "./schema";

config({ path: ".env.local" });

const HOBBIES = [
  { slug: "movies", name: "Movies", icon: "film", pointsPerItem: 1 },
  { slug: "games", name: "Games", icon: "gamepad", pointsPerItem: 1 },
  { slug: "books", name: "Books", icon: "book", pointsPerItem: 1 },
];

type SeedAchievement = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: "general" | "movies" | "games" | "books" | "social";
  requirement: AchievementRequirement;
  sortOrder: number;
};

const ACHIEVEMENTS: SeedAchievement[] = [
  {
    slug: "first_step",
    name: "First Step",
    description: "Complete your first item",
    icon: "sparkle",
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
    slug: "gamer_5",
    name: "Gamer",
    description: "Complete 5 games",
    icon: "gamepad-badge",
    category: "games",
    requirement: { type: "items_completed", count: 5, hobby: "games" },
    sortOrder: 21,
  },
  {
    slug: "bookworm_5",
    name: "Bookworm",
    description: "Complete 5 books",
    icon: "book-badge",
    category: "books",
    requirement: { type: "items_completed", count: 5, hobby: "books" },
    sortOrder: 22,
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
    slug: "gamer_25",
    name: "Hardcore Gamer",
    description: "Complete 25 games",
    icon: "controller-gold",
    category: "games",
    requirement: { type: "items_completed", count: 25, hobby: "games" },
    sortOrder: 31,
  },
  {
    slug: "bookworm_25",
    name: "Scholar",
    description: "Complete 25 books",
    icon: "scroll",
    category: "books",
    requirement: { type: "items_completed", count: 25, hobby: "books" },
    sortOrder: 32,
  },
  {
    slug: "well_rounded",
    name: "Well Rounded",
    description: "Complete 5+ in each hobby",
    icon: "compass",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 5 },
    sortOrder: 40,
  },
  {
    slug: "explorer",
    name: "Explorer",
    description: "Log at least 1 item in all 3 hobbies",
    icon: "map",
    category: "general",
    requirement: { type: "all_hobbies", min_per_hobby: 1 },
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
    requirement: { type: "items_completed", count: 50 },
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

async function main() {
  const { db } = await import("./index");
  const { achievements, hobbies } = await import("./schema");

  console.log("Seeding hobbies…");
  await db.insert(hobbies).values(HOBBIES).onConflictDoNothing({ target: hobbies.slug });

  console.log("Seeding achievements…");
  await db
    .insert(achievements)
    .values(ACHIEVEMENTS)
    .onConflictDoNothing({ target: achievements.slug });

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
