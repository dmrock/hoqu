import { and, eq } from "drizzle-orm";
import { Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PixelBand } from "@/components/ui/pixel-band";
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
      <Card padding="lg" className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Invite not found</h1>
        <p className="text-sm text-muted-foreground">
          The code <span className="font-mono">{code}</span> doesn't match any guild.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/guilds">Back to guilds</Link>
        </Button>
      </Card>
    );
  }

  const [existing] = await db
    .select({ userId: guildMembers.userId })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guild.id), eq(guildMembers.userId, session.user.id)))
    .limit(1);
  if (existing) redirect(`/guilds/${guild.id}`);

  return (
    <Card padding="none" className="mx-auto max-w-md overflow-hidden">
      <PixelBand />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <IconTile size="lg" tone="primary">
            <Shield />
          </IconTile>
          <div className="min-w-0">
            <p className="font-pixel text-[10px] text-primary uppercase">You're invited to</p>
            <h1 className="truncate text-xl font-semibold tracking-tight">{guild.name}</h1>
          </div>
        </div>
        {guild.description ? (
          <p className="text-sm text-muted-foreground">{guild.description}</p>
        ) : null}
        <JoinByCodeButton code={code} />
      </div>
    </Card>
  );
}
