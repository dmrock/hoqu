import { searchGames } from "@/lib/api/rawg";
import { createSearchHandler } from "@/lib/api/search-handler";

export const GET = createSearchHandler("games", searchGames);
