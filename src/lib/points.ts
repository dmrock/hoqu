export type ItemStatus = "completed" | "in_progress" | "planned" | "dropped";
export type HobbySlug = "movies" | "games" | "books";

export type CounterDelta = {
  totalPoints: number;
  moviesCompleted: number;
  gamesCompleted: number;
  booksCompleted: number;
  itemsRated: number;
};

export function computeCounterDelta(args: {
  oldStatus: ItemStatus | null;
  newStatus: ItemStatus | null;
  oldRating: number | null;
  newRating: number | null;
  hobbySlug: HobbySlug;
}): CounterDelta {
  const wasCompleted = args.oldStatus === "completed";
  const isCompleted = args.newStatus === "completed";
  const completedDelta = (isCompleted ? 1 : 0) - (wasCompleted ? 1 : 0);

  const wasRated = args.oldRating != null;
  const isRated = args.newRating != null;
  const ratedDelta = (isRated ? 1 : 0) - (wasRated ? 1 : 0);

  return {
    totalPoints: completedDelta,
    moviesCompleted: args.hobbySlug === "movies" ? completedDelta : 0,
    gamesCompleted: args.hobbySlug === "games" ? completedDelta : 0,
    booksCompleted: args.hobbySlug === "books" ? completedDelta : 0,
    itemsRated: ratedDelta,
  };
}
