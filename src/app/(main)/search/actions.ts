"use server";

import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items } from "@/lib/db/schema";
import type { HobbySlug } from "@/lib/points";

export type SearchHit = {
  id: string;
  title: string;
  year: number | null;
  imageUrl: string | null;
  hobbySlug: HobbySlug;
};

export type SearchCollectionResult = { ok: true; hits: SearchHit[] } | { ok: false; error: string };

const MAX_RESULTS = 20;
const MIN_QUERY_LENGTH = 2;

const querySchema = z.string().min(1).max(100);

export async function searchCollection(rawQuery: string): Promise<SearchCollectionResult> {
  const auth = await requireUserId();
  if (!auth.ok) return auth;

  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) return { ok: true, hits: [] };

  const q = parsed.data.trim();
  if (q.length < MIN_QUERY_LENGTH) return { ok: true, hits: [] };

  // Escape ILIKE metacharacters so the user's literal % and _ don't act as wildcards.
  const escaped = q.replace(/[\\%_]/g, (m) => `\\${m}`);

  const rows = await db
    .select({
      id: items.id,
      title: items.title,
      year: items.year,
      imageUrl: items.imageUrl,
      hobbySlug: hobbies.slug,
    })
    .from(items)
    .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
    .where(
      and(
        eq(items.userId, auth.userId),
        // Skip per-season rows; show parents + flat rows only.
        isNull(items.parentItemId),
        ilike(items.title, `%${escaped}%`),
      ),
    )
    .orderBy(desc(items.updatedAt))
    .limit(MAX_RESULTS);

  return {
    ok: true,
    hits: rows.map((r) => ({
      id: r.id,
      title: r.title,
      year: r.year,
      imageUrl: r.imageUrl,
      hobbySlug: r.hobbySlug as HobbySlug,
    })),
  };
}
