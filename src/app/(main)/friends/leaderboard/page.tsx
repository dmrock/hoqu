import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaderboardScopeTabs } from "@/components/leaderboard/leaderboard-scope-tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { loadFriendsLeaderboard } from "@/lib/leaderboard-queries";
import { parseScope, sortLeaderboard } from "@/lib/leaderboards";

type SearchParamsInput = { [key: string]: string | string[] | undefined };

export default async function FriendsLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const scope = parseScope(typeof sp.scope === "string" ? sp.scope : undefined);

  const rawRows = await loadFriendsLeaderboard(session.user.id);
  const rows = sortLeaderboard(rawRows, scope);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/friends">
            <ChevronLeft />
            Back
          </Link>
        </Button>
        <h1 className="font-pixel text-2xl">Friends leaderboard</h1>
      </div>

      <LeaderboardScopeTabs active={scope} />

      <LeaderboardTable
        rows={rows}
        scope={scope}
        viewerId={session.user.id}
        emptyHint="Add some friends to compare your scores."
      />
    </div>
  );
}
