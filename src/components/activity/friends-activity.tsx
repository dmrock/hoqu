import { loadFriendsActivity } from "@/lib/activity-queries";
import { filterOwnedByHobby } from "@/lib/owned-items";
import { ActivityFeed } from "./activity-feed";

export async function FriendsActivity({
  viewerId,
  includeSelf,
}: {
  viewerId: string;
  includeSelf: boolean;
}) {
  const data = await loadFriendsActivity(viewerId, includeSelf);
  const ownedByHobby = await filterOwnedByHobby(viewerId, data);
  return (
    <ActivityFeed
      data={data}
      ownedByHobby={ownedByHobby}
      emptyHint="Nothing trending yet. Add friends or wait for them to log items."
    />
  );
}
