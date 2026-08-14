import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchGames } from "./igdb";

const { getIgdbAccessToken, invalidateIgdbToken } = vi.hoisted(() => ({
  getIgdbAccessToken: vi.fn(),
  invalidateIgdbToken: vi.fn(),
}));
vi.mock("./igdb-token", () => ({
  getIgdbAccessToken,
  invalidateIgdbToken,
  igdbClientId: () => "test-client-id",
}));

type StubGame = {
  id: number;
  name: string;
  first_release_date?: number;
  cover?: { image_id?: string };
  total_rating?: number;
};

function gamesResponse(games: StubGame[], init?: ResponseInit): Response {
  return new Response(JSON.stringify(games), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

type FetchArgs = [url: string | URL, init?: RequestInit];

function stubFetch(impl: (...args: FetchArgs) => Promise<Response>) {
  const mock = vi.fn(impl);
  vi.stubGlobal("fetch", mock);
  return mock;
}

/** 2001-11-15, the Halo: Combat Evolved release date. */
const HALO_RELEASE = 1_005_782_400;

beforeEach(() => {
  vi.clearAllMocks();
  getIgdbAccessToken.mockResolvedValue("tok-abc");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchGames", () => {
  it("maps an IGDB game onto SearchResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        gamesResponse([
          {
            id: 740,
            name: "Halo: Combat Evolved",
            first_release_date: HALO_RELEASE,
            cover: { image_id: "co2r2r" },
            total_rating: 85.4,
          },
        ]),
      ),
    );

    const [result] = await searchGames("halo");

    expect(result).toEqual({
      externalId: "740",
      title: "Halo: Combat Evolved",
      year: 2001,
      imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2r2r.jpg",
      externalRating: 85,
    });
  });

  it("tolerates games with no cover, rating, or release date", async () => {
    // Bundles like "Halo 3 + Halo Wars" really do come back unrated.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => gamesResponse([{ id: 1, name: "Untitled Bundle" }])),
    );

    const [result] = await searchGames("bundle");

    expect(result).toMatchObject({ year: null, imageUrl: null, externalRating: null });
  });

  it("sends auth headers and an Apicalypse body", async () => {
    const fetchMock = stubFetch(async () => gamesResponse([]));

    await searchGames("halo");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.igdb.com/v4/games");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "Client-ID": "test-client-id",
      Authorization: "Bearer tok-abc",
    });
    expect(init?.body).toContain('search "halo";');
    expect(init?.body).toContain("where version_parent = null;");
    expect(init?.body).toContain("limit 8;");
  });

  it("escapes quotes so a search term cannot break out of the query", async () => {
    const fetchMock = stubFetch(async () => gamesResponse([]));

    await searchGames('the "witcher" 3');

    const body = String(fetchMock.mock.calls[0][1]?.body);
    expect(body).toContain('search "the \\"witcher\\" 3";');
    // The injected quotes must not leave a bare `;` that would start a new clause.
    expect(body.match(/search "(?:[^"\\]|\\.)*";/)).not.toBeNull();
  });

  it("re-authenticates once when a cached token is rejected", async () => {
    getIgdbAccessToken.mockResolvedValueOnce("stale-tok").mockResolvedValueOnce("fresh-tok");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(gamesResponse([], { status: 401, statusText: "Unauthorized" }))
      .mockResolvedValueOnce(gamesResponse([{ id: 1, name: "Doom" }]));
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchGames("doom");

    expect(invalidateIgdbToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer fresh-tok",
    });
    expect(results[0].title).toBe("Doom");
  });

  it("does not retry on failures a new token cannot fix", async () => {
    const fetchMock = vi.fn(async () =>
      gamesResponse([], { status: 400, statusText: "Bad Request" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchGames("doom")).rejects.toThrow("400");
    expect(invalidateIgdbToken).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
