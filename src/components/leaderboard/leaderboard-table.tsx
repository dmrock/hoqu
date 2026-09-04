import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  type LeaderboardRow,
  type LeaderboardScope,
  metricValue,
  SCOPE_OPTIONS,
} from "@/lib/leaderboards";
import { cn } from "@/lib/utils";

// Podium colors for the top three ranks; everyone else is plain mono.
const RANK_CLASS = [
  "font-pixel text-xs text-guild-gold",
  "font-pixel text-xs text-officer-silver",
  "font-pixel text-xs text-[#cd7f32]",
];

export function LeaderboardTable({
  rows,
  scope,
  viewerId,
  emptyHint,
}: {
  rows: LeaderboardRow[];
  scope: LeaderboardScope;
  viewerId: string;
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyHint}</p>;
  }

  const metricLabel = SCOPE_OPTIONS.find((o) => o.value === scope)?.metric ?? "Total points";

  return (
    <Card padding="none" className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.03] text-left font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="w-12 px-3 py-2.5 text-center">#</th>
            <th className="px-3 py-2.5">Adventurer</th>
            <th className="w-32 px-3 py-2.5 text-right">{metricLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const display = row.user.name ?? row.user.username ?? "Unknown";
            const initials = display.slice(0, 2).toUpperCase();
            const isViewer = row.user.id === viewerId;
            const value = metricValue(row, scope);
            return (
              <tr
                key={row.user.id}
                className={cn(
                  "border-t border-border transition-colors",
                  isViewer ? "bg-primary/[0.07]" : "hover:bg-white/[0.025]",
                )}
              >
                <td
                  className={cn(
                    "px-3 py-2.5 text-center",
                    RANK_CLASS[index] ?? "font-mono text-muted-foreground",
                  )}
                >
                  {index + 1}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {row.user.image ? <AvatarImage src={row.user.image} alt={display} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      {row.user.username ? (
                        <Link
                          href={`/profile/${row.user.username}`}
                          className="block truncate font-medium transition-colors hover:text-primary"
                        >
                          {display}
                        </Link>
                      ) : (
                        <p className="truncate font-medium">{display}</p>
                      )}
                      {row.user.username ? (
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          @{row.user.username}
                          {isViewer ? " · you" : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-pixel text-sm text-primary">{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
