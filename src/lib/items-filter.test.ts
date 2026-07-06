import { describe, expect, it } from "vitest";
import {
  ITEMS_PAGE_SIZE,
  pageCount,
  pageForRank,
  parseItemsFilter,
  parsePageParam,
} from "./items-filter";

describe("parseItemsFilter", () => {
  it("defaults to all statuses, no revisit filter, recently-updated sort", () => {
    expect(parseItemsFilter({})).toEqual({
      status: ["completed", "in_progress", "planned", "dropped"],
      revisitOnly: false,
      sort: "updated-desc",
    });
  });

  it("parses a comma-separated status list", () => {
    const filter = parseItemsFilter({ status: "completed,planned" });
    expect(filter.status).toEqual(["completed", "planned"]);
  });

  it("parses a repeated status param (array form)", () => {
    const filter = parseItemsFilter({ status: ["completed", "dropped"] });
    expect(filter.status).toEqual(["completed", "dropped"]);
  });

  it("drops unknown statuses but keeps valid ones", () => {
    const filter = parseItemsFilter({ status: "completed,bogus" });
    expect(filter.status).toEqual(["completed"]);
  });

  it("falls back to all statuses when every value is invalid", () => {
    const filter = parseItemsFilter({ status: "bogus,nope" });
    expect(filter.status).toEqual(["completed", "in_progress", "planned", "dropped"]);
  });

  it("enables revisitOnly only for the literal '1'", () => {
    expect(parseItemsFilter({ revisit: "1" }).revisitOnly).toBe(true);
    expect(parseItemsFilter({ revisit: "true" }).revisitOnly).toBe(false);
    expect(parseItemsFilter({ revisit: ["1"] }).revisitOnly).toBe(false);
  });

  it("keeps a valid sort value", () => {
    expect(parseItemsFilter({ sort: "title-asc" }).sort).toBe("title-asc");
  });

  it("falls back to updated-desc for an invalid sort", () => {
    expect(parseItemsFilter({ sort: "bogus" }).sort).toBe("updated-desc");
    expect(parseItemsFilter({ sort: ["title-asc"] }).sort).toBe("updated-desc");
  });
});

describe("parsePageParam", () => {
  it("parses a positive integer page", () => {
    expect(parsePageParam({ page: "3" })).toBe(3);
  });

  it("defaults to 1 when missing, non-numeric, fractional, zero, or negative", () => {
    expect(parsePageParam({})).toBe(1);
    expect(parsePageParam({ page: "abc" })).toBe(1);
    expect(parsePageParam({ page: "2abc" })).toBe(1);
    expect(parsePageParam({ page: "1.5" })).toBe(1);
    expect(parsePageParam({ page: "0" })).toBe(1);
    expect(parsePageParam({ page: "-2" })).toBe(1);
    expect(parsePageParam({ page: ["2", "3"] })).toBe(1);
  });
});

describe("pageCount", () => {
  it("is 1 for an empty or partial first page", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(1)).toBe(1);
    expect(pageCount(ITEMS_PAGE_SIZE)).toBe(1);
  });

  it("rounds up past exact page boundaries", () => {
    expect(pageCount(ITEMS_PAGE_SIZE + 1)).toBe(2);
    expect(pageCount(ITEMS_PAGE_SIZE * 3)).toBe(3);
  });
});

describe("pageForRank", () => {
  it("maps 1-based ranks onto pages", () => {
    expect(pageForRank(1)).toBe(1);
    expect(pageForRank(ITEMS_PAGE_SIZE)).toBe(1);
    expect(pageForRank(ITEMS_PAGE_SIZE + 1)).toBe(2);
    expect(pageForRank(ITEMS_PAGE_SIZE * 2 + 1)).toBe(3);
  });
});
