import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  type AchievementRequirement,
  achievements,
  hobbies,
  items,
  userAchievements,
  users,
} from "./db/schema";

export type AchievementUnlock = {
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export type UserCounters = {
  totalPoints: number;
  moviesCompleted: number;
  gamesCompleted: number;
  booksCompleted: number;
  showsCompleted: number;
  itemsRated: number;
  loggedByHobby: Record<string, number>;
};

export type EvaluationResult = {
  satisfied: boolean;
  current: number;
  target: number;
  /** What `current`/`target` count, when it isn't the obvious "items" — an
   *  "in every hobby" requirement counts hobbies, not items. */
  unit?: string;
};

const HOBBY_COUNTER: Record<string, keyof UserCounters> = {
  movies: "moviesCompleted",
  tv: "showsCompleted",
  games: "gamesCompleted",
  books: "booksCompleted",
};

const DEFAULT_ALL_HOBBIES = ["movies", "tv", "games", "books"];

type Evaluator<T extends AchievementRequirement = AchievementRequirement> = (
  req: T,
  counters: UserCounters,
) => EvaluationResult;

function completedCount(c: UserCounters, slug: string): number {
  const key = HOBBY_COUNTER[slug];
  if (!key) return 0;
  const value = c[key];
  return typeof value === "number" ? value : 0;
}

function totalCompletedAcrossHobbies(c: UserCounters): number {
  return DEFAULT_ALL_HOBBIES.reduce((sum, slug) => sum + completedCount(c, slug), 0);
}

function maxCompletedInAnyHobby(c: UserCounters): number {
  return DEFAULT_ALL_HOBBIES.reduce((max, slug) => Math.max(max, completedCount(c, slug)), 0);
}

const evaluators: {
  [K in AchievementRequirement["type"]]: Evaluator<Extract<AchievementRequirement, { type: K }>>;
} = {
  items_completed: (req, c) => {
    const target = req.count;
    let current: number;
    if (!req.hobby) {
      current = totalCompletedAcrossHobbies(c);
    } else if (req.hobby === "any") {
      current = maxCompletedInAnyHobby(c);
    } else {
      current = completedCount(c, req.hobby);
    }
    return { satisfied: current >= target, current, target };
  },
  // Progress counts hobbies that already clear the bar, not items: "1 / 25"
  // next to "Complete 25+ in every hobby" reads as hobbies and can't be told
  // apart from a per-item count.
  all_hobbies: (req, c) => {
    const hobbyList = req.hobbies ?? DEFAULT_ALL_HOBBIES;
    const mode = req.mode ?? "completed";
    const counts = hobbyList.map((h) =>
      mode === "logged" ? (c.loggedByHobby[h] ?? 0) : completedCount(c, h),
    );
    const cleared = counts.filter((n) => n >= req.min_per_hobby).length;
    return {
      satisfied: counts.length > 0 && cleared === counts.length,
      current: cleared,
      target: counts.length,
      unit: counts.length === 1 ? "hobby" : "hobbies",
    };
  },
  items_rated: (req, c) => {
    const target = req.count;
    return { satisfied: c.itemsRated >= target, current: c.itemsRated, target };
  },
};

export function evaluateRequirement(
  req: AchievementRequirement,
  counters: UserCounters,
): EvaluationResult {
  const evaluator = evaluators[req.type] as Evaluator | undefined;
  if (!evaluator) return { satisfied: false, current: 0, target: 0 };
  return evaluator(req, counters);
}

export async function loadUserCounters(userId: string): Promise<UserCounters | null> {
  const [row] = await db
    .select({
      totalPoints: users.totalPoints,
      moviesCompleted: users.moviesCompleted,
      gamesCompleted: users.gamesCompleted,
      booksCompleted: users.booksCompleted,
      showsCompleted: users.showsCompleted,
      itemsRated: users.itemsRated,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;

  const loggedRows = await db
    .select({
      slug: hobbies.slug,
      count: sql<number>`count(*)::int`,
    })
    .from(items)
    .innerJoin(hobbies, eq(items.hobbyId, hobbies.id))
    .where(and(eq(items.userId, userId), isNull(items.parentItemId)))
    .groupBy(hobbies.slug);

  const loggedByHobby: Record<string, number> = {};
  for (const r of loggedRows) loggedByHobby[r.slug] = r.count;

  return { ...row, loggedByHobby };
}

export async function checkAchievements(userId: string): Promise<AchievementUnlock[]> {
  const counters = await loadUserCounters(userId);
  if (!counters) return [];

  const unearned = await db
    .select({
      id: achievements.id,
      slug: achievements.slug,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      requirement: achievements.requirement,
    })
    .from(achievements)
    .leftJoin(
      userAchievements,
      and(eq(userAchievements.achievementId, achievements.id), eq(userAchievements.userId, userId)),
    )
    .where(isNull(userAchievements.userId));

  const newly: AchievementUnlock[] = [];
  const inserts: { userId: string; achievementId: string }[] = [];

  for (const a of unearned) {
    const result = evaluateRequirement(a.requirement, counters);
    if (result.satisfied) {
      inserts.push({ userId, achievementId: a.id });
      newly.push({
        slug: a.slug,
        name: a.name,
        description: a.description,
        icon: a.icon,
      });
    }
  }

  if (inserts.length > 0) {
    await db.insert(userAchievements).values(inserts).onConflictDoNothing();
  }

  return newly;
}
