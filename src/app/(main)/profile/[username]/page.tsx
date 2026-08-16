import { and, desc, eq } from "drizzle-orm";
import {
  BookOpen,
  CircleCheck,
  Clapperboard,
  Gamepad2,
  type LucideIcon,
  Star,
  Trophy,
  Tv,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { achievementIcon } from "@/lib/achievement-icons";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { achievements, hobbies, items, userAchievements, users } from "@/lib/db/schema";
import { getFriendshipStatus } from "@/lib/friendships";
import { shareGuild } from "@/lib/guilds";
import type { HobbySlug } from "@/lib/points";
import { FriendStatusButton } from "./friend-status-button";

type ProfileVisibility = "public" | "friends_only" | "guild_only" | "private";

const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  public: "Public",
  friends_only: "Friends only",
  guild_only: "Guild only",
  private: "Private",
};

const HOBBY_META: Record<HobbySlug, { label: string; icon: LucideIcon }> = {
  movies: { label: "Movies", icon: Clapperboard },
  tv: { label: "TV Shows", icon: Tv },
  games: { label: "Games", icon: Gamepad2 },
  books: { label: "Books", icon: BookOpen },
};

const HOBBY_ORDER: HobbySlug[] = ["movies", "tv", "games", "books"];

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
      .limit(5),
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

  const hobbyCards = HOBBY_ORDER.map((slug) => ({
    slug,
    label: HOBBY_META[slug].label,
    icon: HOBBY_META[slug].icon,
    count:
      slug === "movies"
        ? profile.moviesCompleted
        : slug === "tv"
          ? profile.showsCompleted
          : slug === "games"
            ? profile.gamesCompleted
            : profile.booksCompleted,
  }));

  const initials = (profile.name ?? profile.email).slice(0, 2).toUpperCase();
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
  const friendName = profile.name ?? profile.username ?? undefined;

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <Avatar className="size-16">
          {profile.image ? (
            <AvatarImage src={profile.image} alt={profile.name ?? profile.username ?? "Profile"} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="break-words font-pixel text-2xl">{profile.name ?? profile.username}</h1>
          <p className="font-mono text-sm text-muted-foreground">
            @{profile.username} · joined {joined}
          </p>
        </div>
        {isOwner ? (
          <span className="font-mono text-xs text-muted-foreground uppercase">
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
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <p className="text-xs uppercase">{s.label}</p>
              <s.icon className="size-4" />
            </div>
            <p className="font-pixel text-2xl text-primary">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Quest log</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {hobbyCards.map((c) => (
            <div
              key={c.slug}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <c.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{c.label}</p>
                <p className="font-mono text-xs text-muted-foreground">{c.count} completed</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Recently completed</h2>
        {recentlyCompletedRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing completed yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {recentlyCompletedRows.map((item, i) => (
              <div key={item.id} className="min-w-0">
                <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 640px) 200px, 33vw"
                      className="object-cover"
                      // Highest row on the page carrying art — measures as LCP.
                      loading={i < 4 ? "eager" : undefined}
                    />
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs font-medium" title={item.title}>
                  {item.title}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">
                  {HOBBY_META[item.hobbySlug as HobbySlug]?.label ?? item.hobbySlug}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Latest unlocks</h2>
          {isOwner ? (
            <Link href="/achievements" className="text-xs text-primary hover:underline">
              View all
            </Link>
          ) : null}
        </div>
        {recentUnlocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No achievements yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
  );
}
