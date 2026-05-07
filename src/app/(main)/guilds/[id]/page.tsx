import { ExternalLink, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { type GuildRole, getGuildMembers, getGuildWithMembership } from "@/lib/guilds";
import { LeaveGuildButton } from "./leave-guild-button";
import { MemberActionsMenu } from "./member-actions-menu";

const ROLE_LABEL: Record<GuildRole, string> = {
  master: "Master",
  officer: "Officer",
  member: "Member",
};

const ROLE_BADGE: Record<GuildRole, "default" | "secondary" | "outline"> = {
  master: "default",
  officer: "secondary",
  member: "outline",
};

export default async function GuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const ctx = await getGuildWithMembership(id, session.user.id);
  if (!ctx) notFound();
  if (!ctx.viewerRole) notFound();

  const members = await getGuildMembers(id);
  const { guild, viewerRole } = ctx;
  const canEdit = viewerRole === "master" || viewerRole === "officer";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Shield className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-pixel text-2xl">{guild.name}</h1>
          <p className="text-xs text-muted-foreground">
            {members.length} / {guild.maxMembers} members
          </p>
          {guild.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{guild.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
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
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Invite code</p>
          <p className="mt-1 font-mono text-lg tracking-wider">{guild.inviteCode}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this with anyone you want to invite.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Discord</p>
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
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Members</h2>
        <ul className="space-y-2">
          {members.map((m) => {
            const display = m.user.name ?? m.user.username ?? "Unknown";
            const initials = display.slice(0, 2).toUpperCase();
            const isSelf = m.userId === session.user?.id;
            return (
              <li
                key={m.userId}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <Avatar className="size-10">
                  {m.user.image ? <AvatarImage src={m.user.image} alt={display} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  {m.user.username ? (
                    <Link
                      href={`/profile/${m.user.username}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {display}
                    </Link>
                  ) : (
                    <p className="truncate font-medium">{display}</p>
                  )}
                  {m.user.username ? (
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      @{m.user.username}
                    </p>
                  ) : null}
                </div>
                <Badge variant={ROLE_BADGE[m.role]}>{ROLE_LABEL[m.role]}</Badge>
                {!isSelf ? (
                  <MemberActionsMenu
                    guildId={guild.id}
                    memberUserId={m.userId}
                    memberName={display}
                    memberRole={m.role}
                    viewerRole={viewerRole}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
