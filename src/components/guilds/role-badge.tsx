import type { GuildRole } from "@/lib/guilds";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<GuildRole, string> = {
  master: "Master",
  officer: "Officer",
  member: "Member",
};

const ROLE_CLASS: Record<GuildRole, string> = {
  master: "bg-guild-gold/15 text-guild-gold ring-guild-gold/40",
  officer: "bg-officer-silver/10 text-officer-silver ring-officer-silver/35",
  member: "text-muted-foreground ring-white/10",
};

export function RoleBadge({ role, className }: { role: GuildRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md px-2 font-mono text-[10px] uppercase tracking-wider ring-1 ring-inset",
        ROLE_CLASS[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
