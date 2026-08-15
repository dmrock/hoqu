import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/guilds/${ctx.guild.id}`}>
            <ChevronLeft />
            Back
          </Link>
        </Button>
        <h1 className="break-words font-pixel text-2xl">Settings · {ctx.guild.name}</h1>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Guild details</h2>
        <EditGuildForm
          guildId={ctx.guild.id}
          initialDescription={ctx.guild.description ?? ""}
          initialDiscordInviteUrl={ctx.guild.discordInviteUrl ?? ""}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Invite code</h2>
        {isMaster ? (
          <RotateInviteCodeButton guildId={ctx.guild.id} currentCode={ctx.guild.inviteCode} />
        ) : (
          <>
            <p className="font-mono text-lg tracking-wider">{ctx.guild.inviteCode}</p>
            <p className="text-xs text-muted-foreground">Only the master can rotate the code.</p>
          </>
        )}
      </section>

      {isMaster ? (
        <section className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
          <h2 className="font-pixel text-sm text-destructive uppercase">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Deleting the guild removes it for every member. There's no undo.
          </p>
          <DeleteGuildButton guildId={ctx.guild.id} guildName={ctx.guild.name} />
        </section>
      ) : null}
    </div>
  );
}
