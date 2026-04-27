import { createSearchHandler } from "@/lib/api/search-handler";
import { searchTvShows } from "@/lib/api/tmdb";

export const GET = createSearchHandler("tv", searchTvShows);
