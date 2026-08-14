import { searchGames } from "@/lib/api/igdb";
import { createSearchHandler } from "@/lib/api/search-handler";

export const GET = createSearchHandler("games", searchGames);
