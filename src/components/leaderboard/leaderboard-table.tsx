import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  type LeaderboardRow,
  type LeaderboardScope,
  metricValue,
  SCOPE_OPTIONS,
} from "@/lib/leaderboards";
import { cn } from "@/lib/utils";

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
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="w-12 px-3 py-2 text-center">#</th>
            <th className="px-3 py-2">Adventurer</th>
            <th className="w-32 px-3 py-2 text-right">{metricLabel}</th>
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
                  "border-t border-border",
                  isViewer ? "bg-accent/10" : "hover:bg-muted/30",
                )}
              >
                <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {row.user.image ? <AvatarImage src={row.user.image} alt={display} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      {row.user.username ? (
                        <Link
                          href={`/profile/${row.user.username}`}
                          className="block truncate font-medium hover:underline"
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
                <td className="px-3 py-2 text-right font-pixel text-base text-primary">{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
