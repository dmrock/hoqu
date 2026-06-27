import { loadGuildActivity, loadOwnedExternalIds } from "@/lib/activity-queries";
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
  const [data, ownedByHobby] = await Promise.all([
    loadGuildActivity(guildId, viewerId, includeSelf),
    loadOwnedExternalIds(viewerId, ["movies", "tv", "games", "books"]),
  ]);
  return (
    <ActivityFeed
      data={data}
      ownedByHobby={ownedByHobby}
      emptyHint="Nothing trending yet. Check back when members log items."
    />
  );
}
