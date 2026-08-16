import { ActivityFeedSkeleton } from "@/components/activity/activity-feed-skeleton";

export default function FriendsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-pixel text-2xl">Friends</h1>
        <div className="h-8 w-32 rounded-md skeleton" />
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Add friend</h2>
        <div className="flex gap-2">
          <div className="h-9 flex-1 rounded-md skeleton" />
          <div className="h-9 w-24 rounded-md skeleton" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">
          Trending with friends
        </h2>
        <ActivityFeedSkeleton />
      </section>

      <section className="space-y-3">
        <div className="h-4 w-24 rounded skeleton" />
        <ul className="space-y-2">
          {[0, 1, 2].map((row) => (
            <li
              key={row}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="size-10 shrink-0 rounded-full skeleton" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 rounded skeleton" />
                <div className="h-3 w-24 rounded skeleton" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
