import { Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { type FriendListEntry, loadFriendships } from "@/lib/friendships";
import { AddFriendForm } from "./add-friend-form";
import { FriendRowActions } from "./friend-row-actions";

function FriendRow({
  entry,
  mode,
}: {
  entry: FriendListEntry;
  mode: "incoming" | "outgoing" | "friends";
}) {
  const display = entry.user.name ?? entry.user.username ?? "Unknown";
  const initials = display.slice(0, 2).toUpperCase();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Avatar className="size-10">
        {entry.user.image ? <AvatarImage src={entry.user.image} alt={display} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {entry.user.username ? (
          <Link
            href={`/profile/${entry.user.username}`}
            className="block truncate font-medium hover:underline"
          >
            {display}
          </Link>
        ) : (
          <p className="truncate font-medium">{display}</p>
        )}
        {entry.user.username ? (
          <p className="truncate font-mono text-xs text-muted-foreground">@{entry.user.username}</p>
        ) : null}
      </div>
      <FriendRowActions
        friendshipId={entry.friendshipId}
        mode={mode}
        friendName={mode === "friends" ? display : undefined}
      />
    </li>
  );
}

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entries = await loadFriendships(session.user.id);
  const incoming = entries.filter((e) => e.status === "pending_incoming");
  const outgoing = entries.filter((e) => e.status === "pending_outgoing");
  const friends = entries.filter((e) => e.status === "friends");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-pixel text-2xl">Friends</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/friends/leaderboard">
            <Trophy />
            Leaderboard
          </Link>
        </Button>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Add friend</h2>
        <AddFriendForm />
      </section>

      {incoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Incoming requests</h2>
          <ul className="space-y-2">
            {incoming.map((entry) => (
              <FriendRow key={entry.friendshipId} entry={entry} mode="incoming" />
            ))}
          </ul>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Pending requests</h2>
          <ul className="space-y-2">
            {outgoing.map((entry) => (
              <FriendRow key={entry.friendshipId} entry={entry} mode="outgoing" />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">
          Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No friends yet. Send a request to start your party.
          </p>
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
