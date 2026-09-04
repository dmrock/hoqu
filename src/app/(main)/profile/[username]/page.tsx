import { and, desc, eq } from "drizzle-orm";
import { CircleCheck, Lock, Star, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PixelBand } from "@/components/ui/pixel-band";
import { PosterTile } from "@/components/ui/poster-tile";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import { achievementIcon } from "@/lib/achievement-icons";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { achievements, hobbies, items, userAchievements, users } from "@/lib/db/schema";
import { getFriendshipStatus } from "@/lib/friendships";
import { shareGuild } from "@/lib/guilds";
import { HOBBY_META, HOBBY_ORDER } from "@/lib/hobby-meta";
import type { HobbySlug } from "@/lib/points";
import { FriendStatusButton } from "./friend-status-button";

type ProfileVisibility = "public" | "friends_only" | "guild_only" | "private";

const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  public: "Public",
  friends_only: "Friends only",
  guild_only: "Guild only",
  private: "Private",
};

// Deliberately no sibling loading.tsx: a route-level loading state wraps the
// whole page in a Suspense boundary, which flushes (and commits the HTTP
// status to 200) before the notFound() calls below ever run. That would
// silently turn the privacy-driven 404 below into a 200, defeating the
// "can't tell private from nonexistent" guarantee at the status-code level.
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { username } = await params;

  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      email: users.email,
      profileVisibility: users.profileVisibility,
      createdAt: users.createdAt,
      totalPoints: users.totalPoints,
      moviesCompleted: users.moviesCompleted,
      gamesCompleted: users.gamesCompleted,
      booksCompleted: users.booksCompleted,
      showsCompleted: users.showsCompleted,
      itemsRated: users.itemsRated,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  if (!profile) notFound();

  const isOwner = profile.id === session.user.id;
  const visibility = profile.profileVisibility as ProfileVisibility;

  const friendship = isOwner
    ? { status: "none" as const, friendshipId: null }
    : await getFriendshipStatus(session.user.id, profile.id);

  if (visibility === "private" && !isOwner) notFound();
  if (visibility === "friends_only" && !isOwner && friendship.status !== "friends") {
    notFound();
  }
  if (visibility === "guild_only" && !isOwner) {
    const sharesGuild = await shareGuild(session.user.id, profile.id);
    if (!sharesGuild) notFound();
  }

  const [totalUnlocked, recentlyCompletedRows, recentUnlocks] = await Promise.all([
    db.$count(userAchievements, eq(userAchievements.userId, profile.id)),
    db
      .select({
        id: items.id,
        title: items.title,
        imageUrl: items.imageUrl,
        completedAt: items.completedAt,
        hobbySlug: hobbies.slug,
      })
      .from(items)
      .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
      .where(and(eq(items.userId, profile.id), eq(items.status, "completed")))
      .orderBy(desc(items.completedAt))
      // Matches the 8-across poster grid, so the row fills at xl.
      .limit(8),
    db
      .select({
        icon: achievements.icon,
        name: achievements.name,
        description: achievements.description,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, profile.id))
      .orderBy(desc(userAchievements.unlockedAt))
      .limit(4),
  ]);

  const totalCompleted =
    profile.moviesCompleted +
    profile.gamesCompleted +
    profile.booksCompleted +
    profile.showsCompleted;

  const stats = [
    { label: "Total points", value: profile.totalPoints, icon: Zap },
    { label: "Items completed", value: totalCompleted, icon: CircleCheck },
    { label: "Items rated", value: profile.itemsRated, icon: Star },
    { label: "Achievements", value: totalUnlocked, icon: Trophy },
  ];

  const completedBySlug: Record<HobbySlug, number> = {
    movies: profile.moviesCompleted,
    tv: profile.showsCompleted,
    games: profile.gamesCompleted,
    books: profile.booksCompleted,
  };

  const initials = (profile.name ?? profile.email).slice(0, 2).toUpperCase();
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
  const friendName = profile.name ?? profile.username ?? undefined;

  return (
    <div className="space-y-8">
      <Card padding="none" className="overflow-hidden">
        <PixelBand />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="size-16 ring-2 ring-primary/40 ring-offset-2 ring-offset-card">
            {profile.image ? (
              <AvatarImage
                src={profile.image}
                alt={profile.name ?? profile.username ?? "Profile"}
              />
            ) : null}
            <AvatarFallback className="font-pixel text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-semibold tracking-tight md:text-3xl">
              {profile.name ?? profile.username}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              @{profile.username} · joined {joined}
            </p>
          </div>
          {isOwner ? (
            <span className="inline-flex items-center gap-1.5 self-start font-mono text-[11px] text-muted-foreground uppercase tracking-wider sm:self-center">
              <Lock className="size-3" />
              {VISIBILITY_LABEL[visibility]}
            </span>
          ) : profile.username ? (
            <FriendStatusButton
              status={friendship.status}
              friendshipId={friendship.friendshipId}
              username={profile.username}
              friendName={friendName}
            />
          ) : null}
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </section>

      <section className="space-y-3">
        <SectionHeading>Quest log</SectionHeading>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {HOBBY_ORDER.map((slug) => {
            const meta = HOBBY_META[slug];
            return (
              <Card key={slug} className="flex items-center gap-3">
                <IconTile tone={meta.tone}>
                  <meta.icon />
                </IconTile>
                <div className="min-w-0">
                  <p className="font-medium">{meta.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {completedBySlug[slug]} completed
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading>Recently completed</SectionHeading>
        {recentlyCompletedRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing completed yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {recentlyCompletedRows.map((item, i) => (
              <PosterTile
                key={item.id}
                title={item.title}
                imageUrl={item.imageUrl}
                subtitle={HOBBY_META[item.hobbySlug as HobbySlug]?.label ?? item.hobbySlug}
                // Highest row on the page carrying art — measures as LCP.
                eager={i < 4}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading
          action={
            isOwner ? (
              <Link
                href="/achievements"
                className="text-xs text-primary transition-colors hover:text-primary-hover"
              >
                View all
              </Link>
            ) : null
          }
        >
          Latest unlocks
        </SectionHeading>
        {recentUnlocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No achievements yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentUnlocks.map((u) => {
              const Icon = achievementIcon(u.icon);
              return (
                <Card
                  key={`${u.name}-${u.unlockedAt.toISOString()}`}
                  padding="sm"
                  className="flex items-start gap-3"
                >
                  <IconTile tone="solid-accent">
                    <Icon />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
