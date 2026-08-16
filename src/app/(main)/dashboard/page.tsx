import { desc, eq } from "drizzle-orm";
import {
  BookOpen,
  CircleCheck,
  Clapperboard,
  Gamepad2,
  type LucideIcon,
  Trophy,
  Tv,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NewReleasesSkeleton } from "@/components/dashboard/new-releases-row";
import {
  GamesNewReleases,
  MoviesNewReleases,
  TvNewReleases,
} from "@/components/dashboard/new-releases-section";
import { achievementIcon } from "@/lib/achievement-icons";
import { checkAchievements } from "@/lib/achievements";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { achievements, userAchievements, users } from "@/lib/db/schema";
import type { HobbySlug } from "@/lib/points";

type HobbyCard = {
  slug: HobbySlug;
  label: string;
  icon: LucideIcon;
  count: number;
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await checkAchievements(session.user.id).catch((err) => {
    console.error("dashboard checkAchievements failed", err);
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

  const recentUnlocks = await db
    .select({
      icon: achievements.icon,
      name: achievements.name,
      description: achievements.description,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, session.user.id))
    .orderBy(desc(userAchievements.unlockedAt))
    .limit(5);

  const totalUnlocked = await db.$count(
    userAchievements,
    eq(userAchievements.userId, session.user.id),
  );

  const hobbyCards: HobbyCard[] = [
    { slug: "movies", label: "Movies", icon: Clapperboard, count: user.moviesCompleted },
    { slug: "tv", label: "TV Shows", icon: Tv, count: user.showsCompleted },
    { slug: "games", label: "Games", icon: Gamepad2, count: user.gamesCompleted },
    { slug: "books", label: "Books", icon: BookOpen, count: user.booksCompleted },
  ];

  // Short labels so the row fits on the h1's line; `testId` stays the long
  // form because the e2e suite reads stats by `stat-<testId>`.
  const stats = [
    { testId: "Total points", label: "Points", value: user.totalPoints, icon: Zap },
    { testId: "Items completed", label: "Completed", value: totalCompleted, icon: CircleCheck },
    { testId: "Achievements", label: "Achievements", value: totalUnlocked, icon: Trophy },
  ];

  return (
    <div className="space-y-8">
      {/* Stats ride along the header rather than owning a section: as four
          cards they held ~50px of content in ~270px-wide boxes, and the
          header's right half was empty at the same time. */}
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

      {/* Paired on one row from xl: each is two card-rows tall there, so they
          balance instead of stacking into two full-width bands. The 2:3 split
          is what makes a quest card and an unlock card the same width — four
          cards over two tracks, five over three. */}
      <div className="grid gap-6 xl:grid-cols-5">
        <section className="space-y-3 xl:col-span-2">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Quest log</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            {hobbyCards.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <c.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{c.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.count} completed</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3 xl:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-pixel text-sm text-muted-foreground uppercase">Latest unlocks</h2>
            <Link href="/achievements" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentUnlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No achievements yet. Complete items to start unlocking.
            </p>
          ) : (
            // Column counts track Quest log's so the two card sizes match at
            // every width above sm; only the 375px stack differs, where a
            // full-width unlock card stays readable.
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3">
              {recentUnlocks.map((u) => {
                const Icon = achievementIcon(u.icon);
                return (
                  <div
                    key={`${u.name}-${u.unlockedAt.toISOString()}`}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">New releases</h2>
        {/* First row on the page — its posters are the LCP candidate, so they
            skip lazy loading. The rows below it stay lazy. */}
        <Suspense fallback={<NewReleasesSkeleton title="Now in theaters" />}>
          <MoviesNewReleases viewerId={session.user.id} eager />
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
