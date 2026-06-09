import { loadFriendsActivity } from "@/lib/activity-queries";
import { ActivityFeed } from "./activity-feed";

export async function FriendsActivity({
  viewerId,
  includeSelf,
}: {
  viewerId: string;
  includeSelf: boolean;
}) {
  const data = await loadFriendsActivity(viewerId, includeSelf);
  return (
    <ActivityFeed
      data={data}
      emptyHint="Nothing trending yet. Add friends or wait for them to log items."
    />
  );
}
