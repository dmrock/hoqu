import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LeaderboardScopeTabs } from "@/components/leaderboard/leaderboard-scope-tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getGuildWithMembership } from "@/lib/guilds";
import { loadGuildLeaderboard } from "@/lib/leaderboard-queries";
import { parseScope, sortLeaderboard } from "@/lib/leaderboards";

type SearchParamsInput = { [key: string]: string | string[] | undefined };

export default async function GuildLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParamsInput>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const ctx = await getGuildWithMembership(id, session.user.id);
  if (!ctx?.viewerRole) notFound();

  const sp = await searchParams;
  const scope = parseScope(typeof sp.scope === "string" ? sp.scope : undefined);

  const rawRows = await loadGuildLeaderboard(id);
  const rows = sortLeaderboard(rawRows, scope);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/guilds/${ctx.guild.id}`}>
            <ChevronLeft />
            Back
          </Link>
        </Button>
        <h1 className="break-words font-pixel text-2xl">Leaderboard · {ctx.guild.name}</h1>
      </div>

      <LeaderboardScopeTabs active={scope} />

      <LeaderboardTable
        rows={rows}
        scope={scope}
        viewerId={session.user.id}
        emptyHint="No members to rank yet."
      />
    </div>
  );
}
