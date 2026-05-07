import { Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { type GuildRole, loadUserGuilds } from "@/lib/guilds";
import { CreateGuildForm } from "./create-guild-form";
import { JoinGuildForm } from "./join-guild-form";

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

export default async function GuildsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const myGuilds = await loadUserGuilds(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-pixel text-2xl">Guilds</h1>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">
          Join with an invite code
        </h2>
        <JoinGuildForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">
          Your guilds ({myGuilds.length})
        </h2>
        {myGuilds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No guilds yet. Create one below or join with an invite code.
          </p>
        ) : (
          <ul className="space-y-2">
            {myGuilds.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/guilds/${g.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Shield className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{g.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                      {g.description ? ` · ${g.description}` : ""}
                    </p>
                  </div>
                  <Badge variant={ROLE_BADGE[g.role]}>{ROLE_LABEL[g.role]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Create a guild</h2>
        <CreateGuildForm />
      </section>
    </div>
  );
}
