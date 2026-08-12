import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, set } = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("@/lib/redis", () => ({ redis: { get, set } }));

const { cachedSearch } = await import("./cache");

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue(null);
  set.mockResolvedValue("OK");
});

describe("cachedSearch", () => {
  it("returns a hit without calling the fetcher", async () => {
    get.mockResolvedValue([{ title: "cached" }]);
    const fetcher = vi.fn();

    const out = await cachedSearch("games", "Halo", fetcher);

    expect(out).toEqual([{ title: "cached" }]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("normalizes the key so casing and padding share a cache entry", async () => {
    await cachedSearch("games", "  HaLo  ", async () => []);
    expect(get).toHaveBeenCalledWith("search:games:halo");
  });

  it("writes a miss with the 15-minute TTL", async () => {
    const value = [{ title: "Halo" }];

    await cachedSearch("games", "Halo", async () => value);

    expect(set).toHaveBeenCalledWith("search:games:halo", value, { ex: 900 });
  });

  it("never caches a failed lookup", async () => {
    const boom = new Error("RAWG unavailable: no response in 5000ms");

    await expect(
      cachedSearch("games", "Halo", async () => {
        throw boom;
      }),
    ).rejects.toThrow(boom);

    // A timeout must not poison the cache with an empty or partial result —
    // otherwise one outage suppresses that query for the next 15 minutes.
    expect(set).not.toHaveBeenCalled();
  });

  it("falls through to the fetcher when Redis is unreachable", async () => {
    get.mockRejectedValue(new Error("redis down"));

    const out = await cachedSearch("games", "Halo", async () => [{ title: "live" }]);

    expect(out).toEqual([{ title: "live" }]);
  });
});
