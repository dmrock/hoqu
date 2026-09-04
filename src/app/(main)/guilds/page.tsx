import { Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RoleBadge } from "@/components/guilds/role-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { auth } from "@/lib/auth";
import { loadUserGuilds } from "@/lib/guilds";
import { CreateGuildForm } from "./create-guild-form";
import { JoinGuildForm } from "./join-guild-form";

export default async function GuildsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const myGuilds = await loadUserGuilds(session.user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guilds"
        description="Parties of up to 50, each with its own leaderboard and Discord."
      />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Join with an invite code</CardTitle>
          <CardDescription>Eight characters, from whoever runs the guild.</CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGuildForm />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <SectionHeading>Your guilds ({myGuilds.length})</SectionHeading>
        {myGuilds.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No guilds yet"
            description="Create one below or join with an invite code."
          />
        ) : (
          <ul className="space-y-2">
            {myGuilds.map((g) => (
              <li key={g.id}>
                <Card asChild variant="interactive" padding="sm">
                  <Link href={`/guilds/${g.id}`} className="flex items-center gap-3">
                    <IconTile tone="primary">
                      <Shield />
                    </IconTile>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{g.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                        {g.description ? ` · ${g.description}` : ""}
                      </p>
                    </div>
                    <RoleBadge role={g.role} />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Create a guild</CardTitle>
          <CardDescription>You become its master and get an invite code to share.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGuildForm />
        </CardContent>
      </Card>
    </div>
  );
}
