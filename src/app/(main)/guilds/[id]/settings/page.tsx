import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth";
import { getGuildWithMembership } from "@/lib/guilds";
import { EditGuildForm } from "./edit-guild-form";
import { DeleteGuildButton, RotateInviteCodeButton } from "./master-only-actions";

export default async function GuildSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const ctx = await getGuildWithMembership(id, session.user.id);
  if (!ctx) notFound();
  if (ctx.viewerRole !== "master" && ctx.viewerRole !== "officer") notFound();

  const isMaster = ctx.viewerRole === "master";

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/guilds/${ctx.guild.id}`, label: ctx.guild.name }}
        title={`Settings · ${ctx.guild.name}`}
      />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Guild details</CardTitle>
          <CardDescription>What members see on the guild page.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditGuildForm
            guildId={ctx.guild.id}
            initialDescription={ctx.guild.description ?? ""}
            initialDiscordInviteUrl={ctx.guild.discordInviteUrl ?? ""}
          />
        </CardContent>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Invite code</CardTitle>
          <CardDescription>
            {isMaster
              ? "Rotating it stops the old code working immediately."
              : "Only the master can rotate the code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMaster ? (
            <RotateInviteCodeButton guildId={ctx.guild.id} currentCode={ctx.guild.inviteCode} />
          ) : (
            <p className="font-mono text-xl tracking-[0.2em]">{ctx.guild.inviteCode}</p>
          )}
        </CardContent>
      </Card>

      {isMaster ? (
        <Card padding="lg" variant="danger">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Deleting the guild removes it for every member. There's no undo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteGuildButton guildId={ctx.guild.id} guildName={ctx.guild.name} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
