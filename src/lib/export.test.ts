import { describe, expect, it } from "vitest";
import { type ExportedItem, itemsToCsv } from "./export";

function item(overrides: Partial<ExportedItem> = {}): ExportedItem {
  return {
    title: "Inception",
    hobby: "movies",
    externalId: "27205",
    status: "completed",
    userRating: 9,
    note: null,
    wouldRevisit: true,
    year: 2010,
    seasonNumber: null,
    seasonCount: null,
    parentExternalId: null,
    parentTitle: null,
    completedAt: "2026-07-01T12:00:00.000Z",
    createdAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("itemsToCsv", () => {
  it("emits a header plus one line per item", () => {
    const csv = itemsToCsv([item(), item({ externalId: "603", title: "The Matrix" })]);
    const lines = csv.trimEnd().split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      "title,hobby,externalId,status,userRating,note,wouldRevisit,year," +
        "seasonNumber,seasonCount,parentExternalId,parentTitle,completedAt,createdAt",
    );
    expect(lines[1]).toBe(
      "Inception,movies,27205,completed,9,,true,2010,,,,," +
        "2026-07-01T12:00:00.000Z,2026-07-01T12:00:00.000Z",
    );
  });

  it("quotes fields containing commas, quotes or newlines", () => {
    const csv = itemsToCsv([item({ title: 'The "Best", Movie', note: "line one\nline two" })]);
    expect(csv).toContain('"The ""Best"", Movie"');
    expect(csv).toContain('"line one\nline two"');
  });

  it("renders nulls as empty fields", () => {
    const csv = itemsToCsv([
      item({ status: null, userRating: null, year: null, completedAt: null }),
    ]);
    const row = csv.trimEnd().split("\n")[1];
    expect(row).toBe("Inception,movies,27205,,,,true,,,,,,,2026-07-01T12:00:00.000Z");
  });

  it("keeps season linkage columns on TV season rows", () => {
    const csv = itemsToCsv([
      item({
        title: "Season 2",
        hobby: "tv",
        externalId: "500:s2",
        seasonNumber: 2,
        parentExternalId: "500",
        parentTitle: "Ongoing Show",
      }),
    ]);
    expect(csv).toContain("Season 2,tv,500:s2,completed,9,,true,2010,2,,500,Ongoing Show");
  });
});
