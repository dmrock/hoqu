import { Trophy, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ActivityFeedSkeleton } from "@/components/activity/activity-feed-skeleton";
import { ActivityMineToggle } from "@/components/activity/activity-mine-toggle";
import { FriendsActivity } from "@/components/activity/friends-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityRow } from "@/components/ui/entity-row";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { auth } from "@/lib/auth";
import { type FriendListEntry, loadFriendships } from "@/lib/friendships";
import { AddFriendForm } from "./add-friend-form";
import { FriendRowActions } from "./friend-row-actions";

type SearchParamsInput = { [key: string]: string | string[] | undefined };

function FriendRow({
  entry,
  mode,
}: {
  entry: FriendListEntry;
  mode: "incoming" | "outgoing" | "friends";
}) {
  const display = entry.user.name ?? entry.user.username ?? "Unknown";
  return (
    <li>
      <EntityRow name={display} username={entry.user.username} image={entry.user.image}>
        <FriendRowActions
          friendshipId={entry.friendshipId}
          mode={mode}
          friendName={mode === "friends" ? display : undefined}
        />
      </EntityRow>
    </li>
  );
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const includeSelf = sp.mine === "1";

  const entries = await loadFriendships(session.user.id);
  const incoming = entries.filter((e) => e.status === "pending_incoming");
  const outgoing = entries.filter((e) => e.status === "pending_outgoing");
  const friends = entries.filter((e) => e.status === "friends");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Friends"
        description="Your party. Compare progress and borrow recommendations."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/friends/leaderboard">
              <Trophy />
              Leaderboard
            </Link>
          </Button>
        }
      />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Add friend</CardTitle>
          <CardDescription>Send a request by username.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddFriendForm />
        </CardContent>
      </Card>

      {incoming.length > 0 ? (
        <section className="space-y-3">
          <SectionHeading tone="accent">Incoming requests</SectionHeading>
          <ul className="space-y-2">
            {incoming.map((entry) => (
              <FriendRow key={entry.friendshipId} entry={entry} mode="incoming" />
            ))}
          </ul>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="space-y-3">
          <SectionHeading>Pending requests</SectionHeading>
          <ul className="space-y-2">
            {outgoing.map((entry) => (
              <FriendRow key={entry.friendshipId} entry={entry} mode="outgoing" />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeading action={<ActivityMineToggle includeSelf={includeSelf} />}>
          Trending with friends
        </SectionHeading>
        <Suspense key={includeSelf ? "mine" : "others"} fallback={<ActivityFeedSkeleton />}>
          <FriendsActivity viewerId={session.user.id} includeSelf={includeSelf} />
        </Suspense>
      </section>

      <section className="space-y-3">
        <SectionHeading>Friends ({friends.length})</SectionHeading>
        {friends.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No friends yet"
            description="Send a request to start your party."
          />
        ) : (
          <ul className="space-y-2">
            {friends.map((entry) => (
              <FriendRow key={entry.friendshipId} entry={entry} mode="friends" />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
