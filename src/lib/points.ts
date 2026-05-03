export type ItemStatus = "completed" | "in_progress" | "planned" | "dropped";
export type HobbySlug = "movies" | "tv" | "games" | "books";

export type CounterDelta = {
  totalPoints: number;
  moviesCompleted: number;
  gamesCompleted: number;
  booksCompleted: number;
  showsCompleted: number;
  itemsRated: number;
};

/**
 * Compute the delta to apply to a user's denormalized counters when a single
 * item row is created / updated / deleted.
 *
 * Points are SNAPSHOTTED on the item row (`items.points_awarded`). The caller
 * passes both the old snapshot (read from the row before the update) and the
 * new snapshot (whatever value will be written to the row). The total-points
 * delta is just the difference between the two — this keeps historical totals
 * stable even if `hobby.pointsPerItem` is recalibrated later, because old
 * completions keep the snapshot they had at completion time.
 *
 * Per-hobby completion counts are still raw counts (number of completed items
 * in that hobby), unaffected by the points multiplier.
 */
export function computeCounterDelta(args: {
  oldStatus: ItemStatus | null;
  newStatus: ItemStatus | null;
  oldRating: number | null;
  newRating: number | null;
  oldPointsAwarded: number;
  newPointsAwarded: number;
  hobbySlug: HobbySlug;
}): CounterDelta {
  const wasCompleted = args.oldStatus === "completed";
  const isCompleted = args.newStatus === "completed";
  const completedDelta = (isCompleted ? 1 : 0) - (wasCompleted ? 1 : 0);

  const wasRated = args.oldRating != null;
  const isRated = args.newRating != null;
  const ratedDelta = (isRated ? 1 : 0) - (wasRated ? 1 : 0);

  const pointsDelta = args.newPointsAwarded - args.oldPointsAwarded;

  return {
    totalPoints: pointsDelta,
    moviesCompleted: args.hobbySlug === "movies" ? completedDelta : 0,
    gamesCompleted: args.hobbySlug === "games" ? completedDelta : 0,
    booksCompleted: args.hobbySlug === "books" ? completedDelta : 0,
    showsCompleted: args.hobbySlug === "tv" ? completedDelta : 0,
    itemsRated: ratedDelta,
  };
}

/**
 * Snapshot value to store on an item row given its (about-to-be) status and
 * the hobby's current points-per-item config.
 */
export function snapshotPoints(args: { status: ItemStatus | null; pointsPerItem: number }): number {
  return args.status === "completed" ? args.pointsPerItem : 0;
}
