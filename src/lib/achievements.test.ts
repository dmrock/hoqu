import { describe, expect, it } from "vitest";
import { evaluateRequirement, type UserCounters } from "./achievements";

const baseCounters: UserCounters = {
  totalPoints: 0,
  moviesCompleted: 0,
  gamesCompleted: 0,
  booksCompleted: 0,
  showsCompleted: 0,
  itemsRated: 0,
  loggedByHobby: {},
};

describe("evaluateRequirement — items_completed", () => {
  it("with hobby filter checks the right counter", () => {
    const result = evaluateRequirement(
      { type: "items_completed", count: 5, hobby: "movies" },
      { ...baseCounters, moviesCompleted: 5 },
    );
    expect(result).toEqual({ satisfied: true, current: 5, target: 5 });
  });

  it("with hobby filter ignores unrelated hobby progress", () => {
    const result = evaluateRequirement(
      { type: "items_completed", count: 5, hobby: "movies" },
      { ...baseCounters, gamesCompleted: 100 },
    );
    expect(result.satisfied).toBe(false);
    expect(result.current).toBe(0);
  });

  it("without hobby filter falls back to totalPoints", () => {
    const result = evaluateRequirement(
      { type: "items_completed", count: 50 },
      { ...baseCounters, totalPoints: 75 },
    );
    expect(result).toEqual({ satisfied: true, current: 75, target: 50 });
  });

  it("unknown hobby slug yields 0 current", () => {
    const result = evaluateRequirement(
      { type: "items_completed", count: 1, hobby: "puzzles" },
      { ...baseCounters, moviesCompleted: 99 },
    );
    expect(result.satisfied).toBe(false);
    expect(result.current).toBe(0);
  });

  it("just below target is not satisfied", () => {
    const result = evaluateRequirement(
      { type: "items_completed", count: 10, hobby: "books" },
      { ...baseCounters, booksCompleted: 9 },
    );
    expect(result.satisfied).toBe(false);
  });
});

describe("evaluateRequirement — all_hobbies", () => {
  it("satisfied only when every hobby meets the minimum (completed mode)", () => {
    const result = evaluateRequirement(
      { type: "all_hobbies", min_per_hobby: 1 },
      {
        ...baseCounters,
        moviesCompleted: 1,
        showsCompleted: 1,
        gamesCompleted: 1,
        booksCompleted: 1,
      },
    );
    expect(result.satisfied).toBe(true);
    expect(result.current).toBe(1);
  });

  it("not satisfied if any hobby is below the minimum", () => {
    const result = evaluateRequirement(
      { type: "all_hobbies", min_per_hobby: 1 },
      { ...baseCounters, moviesCompleted: 5, showsCompleted: 0 },
    );
    expect(result.satisfied).toBe(false);
    expect(result.current).toBe(0);
  });

  it("logged mode uses loggedByHobby instead of completed counts", () => {
    const counters: UserCounters = {
      ...baseCounters,
      loggedByHobby: { movies: 1, tv: 1, games: 1, books: 1 },
    };
    const result = evaluateRequirement(
      { type: "all_hobbies", min_per_hobby: 1, mode: "logged" },
      counters,
    );
    expect(result.satisfied).toBe(true);
  });

  it("custom hobby list narrows the check", () => {
    const result = evaluateRequirement(
      { type: "all_hobbies", min_per_hobby: 2, hobbies: ["movies", "books"] },
      { ...baseCounters, moviesCompleted: 2, booksCompleted: 2, gamesCompleted: 0 },
    );
    expect(result.satisfied).toBe(true);
  });

  it("empty hobby list yields not-satisfied", () => {
    const result = evaluateRequirement(
      { type: "all_hobbies", min_per_hobby: 1, hobbies: [] },
      baseCounters,
    );
    expect(result.satisfied).toBe(false);
    expect(result.current).toBe(0);
  });
});

describe("evaluateRequirement — items_rated", () => {
  it("satisfied at exact target", () => {
    const result = evaluateRequirement(
      { type: "items_rated", count: 10 },
      { ...baseCounters, itemsRated: 10 },
    );
    expect(result).toEqual({ satisfied: true, current: 10, target: 10 });
  });

  it("not satisfied below target", () => {
    const result = evaluateRequirement(
      { type: "items_rated", count: 10 },
      { ...baseCounters, itemsRated: 3 },
    );
    expect(result.satisfied).toBe(false);
  });
});
