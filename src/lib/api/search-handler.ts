import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { type SearchResponse, type SearchResult, searchQuerySchema } from "./search";

export function createSearchHandler(fetcher: (query: string) => Promise<SearchResult[]>) {
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

    try {
      const data = await fetcher(parsed.data.q);
      return NextResponse.json({ data, error: null });
    } catch (err) {
      console.error("search handler failed", err);
      return NextResponse.json({ data: null, error: "Search failed" }, { status: 502 });
    }
  };
}
