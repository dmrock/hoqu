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

const evaluators: {
  [K in AchievementRequirement["type"]]: Evaluator<Extract<AchievementRequirement, { type: K }>>;
} = {
  items_completed: (req, c) => {
    const target = req.count;
    const current = req.hobby ? completedCount(c, req.hobby) : c.totalPoints;
    return { satisfied: current >= target, current, target };
  },
  all_hobbies: (req, c) => {
    const hobbyList = req.hobbies ?? DEFAULT_ALL_HOBBIES;
    const target = req.min_per_hobby;
    const mode = req.mode ?? "completed";
    const counts = hobbyList.map((h) =>
      mode === "logged" ? (c.loggedByHobby[h] ?? 0) : completedCount(c, h),
    );
    const min = counts.length > 0 ? Math.min(...counts) : 0;
    const satisfied = counts.length > 0 && counts.every((n) => n >= target);
    return { satisfied, current: min, target };
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
