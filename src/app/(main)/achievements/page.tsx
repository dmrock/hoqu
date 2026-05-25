import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { achievementIcon } from "@/lib/achievement-icons";
import {
  checkAchievements,
  type EvaluationResult,
  evaluateRequirement,
  loadUserCounters,
} from "@/lib/achievements";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  milestones: "Milestones",
  ratings: "Ratings",
  movies: "Movies",
  tv: "TV Shows",
  games: "Games",
  books: "Books",
  social: "Social",
};

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Idempotent re-check on page visit catches cases where criteria existed
  // before the engine was wired up, or where new achievements were seeded.
  await checkAchievements(session.user.id);

  const counters = await loadUserCounters(session.user.id);

  const all = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      category: achievements.category,
      requirement: achievements.requirement,
      sortOrder: achievements.sortOrder,
    })
    .from(achievements)
    .orderBy(asc(achievements.sortOrder), asc(achievements.name));

  const unlockedRows = await db
    .select({
      achievementId: userAchievements.achievementId,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, session.user.id));
  const unlockedMap = new Map(unlockedRows.map((r) => [r.achievementId, r.unlockedAt]));

  type Row = (typeof all)[number] & {
    unlocked: boolean;
    unlockedAt: Date | null;
    progress: EvaluationResult;
  };

  const rows: Row[] = all.map((a) => {
    const unlockedAt = unlockedMap.get(a.id) ?? null;
    return {
      ...a,
      unlocked: unlockedAt !== null,
      unlockedAt,
      progress: counters
        ? evaluateRequirement(a.requirement, counters)
        : { satisfied: false, current: 0, target: 0 },
    };
  });

  const totalUnlocked = rows.filter((r) => r.unlocked).length;
  const grouped = new Map<string, Row[]>();
  for (const r of rows) {
    const list = grouped.get(r.category) ?? [];
    list.push(r);
    grouped.set(r.category, list);
  }
  const categoryOrder = [
    "general",
    "milestones",
    "ratings",
    "movies",
    "tv",
    "games",
    "books",
    "social",
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-pixel text-2xl">Achievements</h1>
        <p className="font-mono text-sm text-muted-foreground">
          {totalUnlocked} / {rows.length} unlocked
        </p>
      </div>

      {categoryOrder
        .filter((c) => grouped.has(c))
        .map((category) => {
          const items = grouped.get(category) ?? [];
          return (
            <section key={category} className="space-y-3">
              <h2 className="font-pixel text-sm text-muted-foreground uppercase">
                {CATEGORY_LABEL[category] ?? category}
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => {
                  const Icon = achievementIcon(item.icon);
                  const pct =
                    item.progress.target > 0
                      ? Math.min(
                          100,
                          Math.round((item.progress.current / item.progress.target) * 100),
                        )
                      : 0;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors",
                        item.unlocked ? "" : "opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-lg",
                          item.unlocked
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        {item.unlocked ? (
                          <p className="font-mono text-xs text-accent">
                            Unlocked
                            {item.unlockedAt
                              ? ` ${new Date(item.unlockedAt).toLocaleDateString()}`
                              : ""}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.progress.current} / {item.progress.target}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
