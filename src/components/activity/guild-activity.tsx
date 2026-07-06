import { loadGuildActivity } from "@/lib/activity-queries";
import { filterOwnedByHobby } from "@/lib/owned-items";
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
  const ownedByHobby = await filterOwnedByHobby(viewerId, data);
  return (
    <ActivityFeed
      data={data}
      ownedByHobby={ownedByHobby}
      emptyHint="Nothing trending yet. Check back when members log items."
    />
  );
}
