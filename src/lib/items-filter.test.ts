import { describe, expect, it } from "vitest";
import { parseItemsFilter } from "./items-filter";

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
