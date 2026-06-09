import { loadGuildActivity } from "@/lib/activity-queries";
import { ActivityFeed } from "./activity-feed";

export async function GuildActivity({
  guildId,
  viewerId,
  includeSelf,
}: {
  guildId: string;
  viewerId: string;
  includeSelf: boolean;
}) {
  const data = await loadGuildActivity(guildId, viewerId, includeSelf);
  return (
    <ActivityFeed
      data={data}
      emptyHint="Nothing trending yet. Check back when members log items."
    />
  );
}
