import { z } from "zod";

export type SearchResult = {
  externalId: string;
  title: string;
  year: number | null;
  imageUrl: string | null;
  externalRating: number | null;
};

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});

export type SearchResponse =
  | { data: SearchResult[]; error: null }
  | {
      data: null;
      error: string;
    };
