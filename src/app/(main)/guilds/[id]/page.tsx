import { ExternalLink, Settings, Shield, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ActivityFeedSkeleton } from "@/components/activity/activity-feed-skeleton";
import { ActivityMineToggle } from "@/components/activity/activity-mine-toggle";
import { GuildActivity } from "@/components/activity/guild-activity";
import { RoleBadge } from "@/components/guilds/role-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EntityRow } from "@/components/ui/entity-row";
import { IconTile } from "@/components/ui/icon-tile";
import { PixelBand } from "@/components/ui/pixel-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { auth } from "@/lib/auth";
import { getGuildMembers, getGuildWithMembership } from "@/lib/guilds";
import { LeaveGuildButton } from "./leave-guild-button";
import { MemberActionsMenu } from "./member-actions-menu";

type SearchParamsInput = { [key: string]: string | string[] | undefined };

export default async function GuildDetailPage({
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
  if (!ctx) notFound();
  if (!ctx.viewerRole) notFound();

  const sp = await searchParams;
  const includeSelf = sp.mine === "1";

  const members = await getGuildMembers(id);
  const { guild, viewerRole } = ctx;
  const canEdit = viewerRole === "master" || viewerRole === "officer";

  return (
    <div className="space-y-6">
      <Card padding="none" className="overflow-hidden">
        <PixelBand />
        {/* The three actions need ~335px side by side, so below sm they drop
            under the identity block and wrap among themselves. */}
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <IconTile size="xl" tone="primary">
              <Shield />
            </IconTile>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-2xl font-semibold tracking-tight md:text-3xl">
                {guild.name}
              </h1>
              <p className="font-mono text-xs text-muted-foreground">
                {members.length} / {guild.maxMembers} members
              </p>
              {guild.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{guild.description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/guilds/${guild.id}/leaderboard`}>
                <Trophy />
                Leaderboard
              </Link>
            </Button>
            {canEdit ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/guilds/${guild.id}/settings`}>
                  <Settings />
                  Settings
                </Link>
              </Button>
            ) : null}
            <LeaveGuildButton
              guildId={guild.id}
              guildName={guild.name}
              isMaster={viewerRole === "master" && members.length === 1}
            />
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Invite code</p>
          <p className="mt-1 font-mono text-xl tracking-[0.2em]" data-testid="invite-code">
            {guild.inviteCode}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this with anyone you want to invite.
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Discord</p>
          {guild.discordInviteUrl ? (
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href={guild.discordInviteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                Join Discord
              </a>
            </Button>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {canEdit ? "Add a Discord URL in settings." : "No Discord invite set."}
            </p>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading action={<ActivityMineToggle includeSelf={includeSelf} />}>
          Trending
        </SectionHeading>
        <Suspense key={includeSelf ? "mine" : "others"} fallback={<ActivityFeedSkeleton />}>
          <GuildActivity guildId={guild.id} viewerId={session.user.id} includeSelf={includeSelf} />
        </Suspense>
      </section>

      <section className="space-y-3">
        <SectionHeading>Members</SectionHeading>
        <ul className="space-y-2">
          {members.map((m) => {
            const display = m.user.name ?? m.user.username ?? "Unknown";
            const isSelf = m.userId === session.user?.id;
            return (
              <li key={m.userId}>
                <EntityRow name={display} username={m.user.username} image={m.user.image}>
                  <RoleBadge role={m.role} />
                  {!isSelf ? (
                    <MemberActionsMenu
                      guildId={guild.id}
                      memberUserId={m.userId}
                      memberName={display}
                      memberRole={m.role}
                      viewerRole={viewerRole}
                    />
                  ) : null}
                </EntityRow>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
