import { searchBooks } from "@/lib/api/openlibrary";
import { createSearchHandler } from "@/lib/api/search-handler";

export const GET = createSearchHandler(searchBooks);
