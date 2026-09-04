import { ActivityFeedSkeleton } from "@/components/activity/activity-feed-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";

export default function FriendsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Friends"
        description="Your party. Compare progress and borrow recommendations."
        actions={<div className="h-7 w-32 rounded-md skeleton" />}
      />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Add friend</CardTitle>
          <CardDescription>Send a request by username.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <div className="h-8 flex-1 rounded-lg skeleton" />
          <div className="h-8 w-28 rounded-lg skeleton" />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <SectionHeading>Trending with friends</SectionHeading>
        <ActivityFeedSkeleton />
      </section>

      <section className="space-y-3">
        <div className="h-3 w-24 rounded skeleton" />
        <ul className="space-y-2">
          {[0, 1, 2].map((row) => (
            <Card key={row} asChild padding="sm">
              <li className="flex items-center gap-3">
                <div className="size-10 shrink-0 rounded-full skeleton" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-32 rounded skeleton" />
                  <div className="h-3 w-24 rounded skeleton" />
                </div>
              </li>
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
