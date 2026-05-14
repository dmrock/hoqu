import { describe, expect, it } from "vitest";
import { computeCounterDelta, snapshotPoints } from "./points";

describe("snapshotPoints", () => {
  it("returns pointsPerItem when status is completed", () => {
    expect(snapshotPoints({ status: "completed", pointsPerItem: 10 })).toBe(10);
  });

  it("returns 0 for any non-completed status", () => {
    expect(snapshotPoints({ status: "planned", pointsPerItem: 10 })).toBe(0);
    expect(snapshotPoints({ status: "in_progress", pointsPerItem: 10 })).toBe(0);
    expect(snapshotPoints({ status: "dropped", pointsPerItem: 10 })).toBe(0);
    expect(snapshotPoints({ status: null, pointsPerItem: 10 })).toBe(0);
  });
});

describe("computeCounterDelta", () => {
  const base = {
    oldStatus: null,
    newStatus: null,
    oldRating: null,
    newRating: null,
    oldPointsAwarded: 0,
    newPointsAwarded: 0,
    hobbySlug: "movies" as const,
  };

  it("new completed movie ticks moviesCompleted and totalPoints", () => {
    expect(
      computeCounterDelta({
        ...base,
        newStatus: "completed",
        newPointsAwarded: 1,
      }),
    ).toEqual({
      totalPoints: 1,
      moviesCompleted: 1,
      gamesCompleted: 0,
      booksCompleted: 0,
      showsCompleted: 0,
      itemsRated: 0,
    });
  });

  it("uncompleting an item rolls back points and hobby counter", () => {
    expect(
      computeCounterDelta({
        ...base,
        oldStatus: "completed",
        newStatus: "planned",
        oldPointsAwarded: 1,
        newPointsAwarded: 0,
      }),
    ).toEqual({
      totalPoints: -1,
      moviesCompleted: -1,
      gamesCompleted: 0,
      booksCompleted: 0,
      showsCompleted: 0,
      itemsRated: 0,
    });
  });

  it("status unchanged returns zero deltas across the board", () => {
    expect(
      computeCounterDelta({
        ...base,
        oldStatus: "completed",
        newStatus: "completed",
        oldPointsAwarded: 1,
        newPointsAwarded: 1,
      }),
    ).toEqual({
      totalPoints: 0,
      moviesCompleted: 0,
      gamesCompleted: 0,
      booksCompleted: 0,
      showsCompleted: 0,
      itemsRated: 0,
    });
  });

  it("adding a rating bumps itemsRated by +1", () => {
    expect(
      computeCounterDelta({
        ...base,
        newRating: 7,
      }).itemsRated,
    ).toBe(1);
  });

  it("removing a rating bumps itemsRated by -1", () => {
    expect(
      computeCounterDelta({
        ...base,
        oldRating: 7,
        newRating: null,
      }).itemsRated,
    ).toBe(-1);
  });

  it("changing a rating value doesn't touch itemsRated", () => {
    expect(
      computeCounterDelta({
        ...base,
        oldRating: 6,
        newRating: 9,
      }).itemsRated,
    ).toBe(0);
  });

  it("routes hobby counter by slug — tv hits showsCompleted, not moviesCompleted", () => {
    const delta = computeCounterDelta({
      ...base,
      newStatus: "completed",
      hobbySlug: "tv",
      newPointsAwarded: 5,
    });
    expect(delta.showsCompleted).toBe(1);
    expect(delta.moviesCompleted).toBe(0);
    expect(delta.totalPoints).toBe(5);
  });

  it("points delta reflects snapshot change even when status unchanged (e.g. recalibration)", () => {
    expect(
      computeCounterDelta({
        ...base,
        oldStatus: "completed",
        newStatus: "completed",
        oldPointsAwarded: 1,
        newPointsAwarded: 3,
      }).totalPoints,
    ).toBe(2);
  });

  it("books slug routes to booksCompleted", () => {
    expect(
      computeCounterDelta({
        ...base,
        newStatus: "completed",
        hobbySlug: "books",
        newPointsAwarded: 6,
      }).booksCompleted,
    ).toBe(1);
  });

  it("games slug routes to gamesCompleted", () => {
    expect(
      computeCounterDelta({
        ...base,
        newStatus: "completed",
        hobbySlug: "games",
        newPointsAwarded: 10,
      }).gamesCompleted,
    ).toBe(1);
  });
});
