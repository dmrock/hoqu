import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { filterOwnedExternalIds } from "@/lib/owned-items";
import type { HobbySlug } from "@/lib/points";
import { checkSearchLimit } from "@/lib/rate-limit";
import { cachedSearch } from "./cache";
import { type SearchResponse, type SearchResult, searchQuerySchema } from "./search";
import { UpstreamUnavailableError } from "./upstream";

export function createSearchHandler(
  hobby: HobbySlug,
  fetcher: (query: string) => Promise<SearchResult[]>,
) {
  return async function handler(req: NextRequest): Promise<NextResponse<SearchResponse>> {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = searchQuerySchema.safeParse({
      q: req.nextUrl.searchParams.get("q") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "Invalid query" }, { status: 400 });
    }

    // Consumed on cache hits too: the point is to cap one account's total
    // search volume, not just what reaches the upstream API.
    const limit = await checkSearchLimit(session.user.id);
    if (!limit.ok) {
      return NextResponse.json(
        { data: null, error: "Too many searches. Give it a minute." },
        { status: 429 },
      );
    }

    try {
      const data = await cachedSearch(hobby, parsed.data.q, () => fetcher(parsed.data.q));

      // Ownership is annotated after the cache (results are shared across
      // users) and fails open — it's a UX badge; addItem still rejects dupes.
      let ownedIds: string[] = [];
      try {
        ownedIds = await filterOwnedExternalIds(
          session.user.id,
          hobby,
          data.map((r) => r.externalId),
        );
      } catch (err) {
        console.error("search owned-annotation failed", err);
      }
      const owned = new Set(ownedIds);

      return NextResponse.json({
        data: data.map((r) => ({ ...r, owned: owned.has(r.externalId) })),
        error: null,
      });
    } catch (err) {
      console.error("search handler failed", err);
      if (err instanceof UpstreamUnavailableError) {
        return NextResponse.json(
          { data: null, error: `${err.provider} isn't responding. Try again in a moment.` },
          { status: 503 },
        );
      }
      return NextResponse.json({ data: null, error: "Search failed" }, { status: 502 });
    }
  };
}
