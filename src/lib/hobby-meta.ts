import { BookOpen, Clapperboard, Gamepad2, type LucideIcon, Tv } from "lucide-react";
import type { HobbySlug } from "./points";

export type HobbyTone = "primary" | "accent" | "warning" | "foreground";

/** Display metadata per hobby; each gets its own tint so mixed lists scan. */
export const HOBBY_META: Record<
  HobbySlug,
  { label: string; singular: string; icon: LucideIcon; tone: HobbyTone }
> = {
  movies: { label: "Movies", singular: "movie", icon: Clapperboard, tone: "primary" },
  tv: { label: "TV Shows", singular: "TV show", icon: Tv, tone: "accent" },
  games: { label: "Games", singular: "game", icon: Gamepad2, tone: "warning" },
  books: { label: "Books", singular: "book", icon: BookOpen, tone: "foreground" },
};

export const HOBBY_ORDER: HobbySlug[] = ["movies", "tv", "games", "books"];
