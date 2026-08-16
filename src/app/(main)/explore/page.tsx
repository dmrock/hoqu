import { and, desc, eq } from "drizzle-orm";
import { CircleCheck, Trophy, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { type ContinueItem, ContinueRow } from "@/components/explore/continue-row";
import { NewReleasesSkeleton } from "@/components/explore/new-releases-row";
import {
  GamesNewReleases,
  MoviesNewReleases,
  TvNewReleases,
} from "@/components/explore/new-releases-section";
import { checkAchievements } from "@/lib/achievements";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hobbies, items, userAchievements, users } from "@/lib/db/schema";
import type { HobbySlug } from "@/lib/points";

/** In-progress cards on Explore; one row at the widest breakpoint. */
const CONTINUE_LIMIT = 8;

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await checkAchievements(session.user.id).catch((err) => {
    console.error("explore checkAchievements failed", err);
  });

  const [user] = await db
    .select({
      name: users.name,
      totalPoints: users.totalPoints,
      moviesCompleted: users.moviesCompleted,
      gamesCompleted: users.gamesCompleted,
      booksCompleted: users.booksCompleted,
      showsCompleted: users.showsCompleted,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  const totalCompleted =
    user.moviesCompleted + user.gamesCompleted + user.booksCompleted + user.showsCompleted;

  const [totalUnlocked, inProgressRows] = await Promise.all([
    db.$count(userAchievements, eq(userAchievements.userId, session.user.id)),
    db
      .select({
        id: items.id,
        title: items.title,
        imageUrl: items.imageUrl,
        hobbySlug: hobbies.slug,
      })
      .from(items)
      .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
      .where(and(eq(items.userId, session.user.id), eq(items.status, "in_progress")))
      .orderBy(desc(items.updatedAt))
      .limit(CONTINUE_LIMIT),
  ]);

  const continueItems: ContinueItem[] = inProgressRows.map((row) => ({
    ...row,
    hobbySlug: row.hobbySlug as HobbySlug,
  }));

  // Short labels so the row fits on the h1's line; `testId` stays the long
  // form because the e2e suite reads stats by `stat-<testId>`.
  const stats = [
    { testId: "Total points", label: "Points", value: user.totalPoints, icon: Zap },
    { testId: "Items completed", label: "Completed", value: totalCompleted, icon: CircleCheck },
    { testId: "Achievements", label: "Achievements", value: totalUnlocked, icon: Trophy },
  ];

  return (
    <div className="space-y-8">
      {/* Stats ride along the header rather than owning a section: as cards
          they held ~50px of content in ~270px-wide boxes, and the header's
          right half was empty at the same time. */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h1 className="break-words font-pixel text-2xl">Welcome, {user.name ?? "adventurer"}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {stats.map((s) => (
              <div key={s.testId} className="flex items-center gap-2">
                <s.icon className="size-4 shrink-0 text-muted-foreground" />
                <span
                  className="font-pixel text-base text-primary"
                  data-testid={`stat-${s.testId}`}
                >
                  {s.value}
                </span>
                <span className="text-xs text-muted-foreground uppercase">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          We trust our adventurers to log their quests honestly.
        </p>
      </div>

      <ContinueRow items={continueItems} />

      <section className="space-y-4">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">New releases</h2>
        {/* Only eager when nothing sits above it — otherwise Continue owns the
            LCP and preloading these too would just compete for bandwidth. */}
        <Suspense fallback={<NewReleasesSkeleton title="Now in theaters" />}>
          <MoviesNewReleases viewerId={session.user.id} eager={continueItems.length === 0} />
        </Suspense>
        <Suspense fallback={<NewReleasesSkeleton title="New episodes" />}>
          <TvNewReleases viewerId={session.user.id} />
        </Suspense>
        <Suspense fallback={<NewReleasesSkeleton title="Just launched" />}>
          <GamesNewReleases viewerId={session.user.id} />
        </Suspense>
      </section>
    </div>
  );
}
