import { redirect } from "next/navigation";
import { LeaderboardScopeTabs } from "@/components/leaderboard/leaderboard-scope-tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader back={{ href: "/friends", label: "Friends" }} title="Friends leaderboard" />

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
