import { and, eq } from "drizzle-orm";
import { Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guildMembers, guilds } from "@/lib/db/schema";
import { JoinByCodeButton } from "./join-button";

export default async function JoinGuildPage({ params }: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  const [guild] = await db
    .select({
      id: guilds.id,
      name: guilds.name,
      description: guilds.description,
      maxMembers: guilds.maxMembers,
    })
    .from(guilds)
    .where(eq(guilds.inviteCode, code))
    .limit(1);

  if (!guild) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
        <h1 className="font-pixel text-xl">Invite not found</h1>
        <p className="text-sm text-muted-foreground">
          The code <span className="font-mono">{code}</span> doesn't match any guild.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/guilds">Back to guilds</Link>
        </Button>
      </div>
    );
  }

  const [existing] = await db
    .select({ userId: guildMembers.userId })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guild.id), eq(guildMembers.userId, session.user.id)))
    .limit(1);
  if (existing) redirect(`/guilds/${guild.id}`);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Shield className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">You're invited to</p>
          <h1 className="truncate font-pixel text-xl">{guild.name}</h1>
        </div>
      </div>
      {guild.description ? (
        <p className="text-sm text-muted-foreground">{guild.description}</p>
      ) : null}
      <JoinByCodeButton code={code} />
    </div>
  );
}
