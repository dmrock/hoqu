import { createSearchHandler } from "@/lib/api/search-handler";
import { searchMovies } from "@/lib/api/tmdb";

export const GET = createSearchHandler("movies", searchMovies);
