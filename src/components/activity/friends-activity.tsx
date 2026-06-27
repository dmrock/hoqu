import { loadFriendsActivity, loadOwnedExternalIds } from "@/lib/activity-queries";
import { ActivityFeed } from "./activity-feed";

export async function FriendsActivity({
  viewerId,
  includeSelf,
}: {
  viewerId: string;
  includeSelf: boolean;
}) {
  const [data, ownedByHobby] = await Promise.all([
    loadFriendsActivity(viewerId, includeSelf),
    loadOwnedExternalIds(viewerId, ["movies", "tv", "games", "books"]),
  ]);
  return (
    <ActivityFeed
      data={data}
      ownedByHobby={ownedByHobby}
      emptyHint="Nothing trending yet. Add friends or wait for them to log items."
    />
  );
}
