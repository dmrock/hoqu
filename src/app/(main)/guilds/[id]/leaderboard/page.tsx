import { notFound, redirect } from "next/navigation";
import { LeaderboardScopeTabs } from "@/components/leaderboard/leaderboard-scope-tabs";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        back={{ href: `/guilds/${ctx.guild.id}`, label: ctx.guild.name }}
        title={`Leaderboard · ${ctx.guild.name}`}
      />

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
