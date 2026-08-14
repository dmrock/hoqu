import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redisGet, redisSet, redisDel } = vi.hoisted(() => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  redisDel: vi.fn(),
}));
vi.mock("@/lib/redis", () => ({
  redis: { get: redisGet, set: redisSet, del: redisDel },
}));

/** Real figure observed from Twitch — deliberately not the value in IGDB's docs. */
const EXPIRES_IN = 4_851_354;
const MARGIN = 300;

function tokenResponse(expiresIn = EXPIRES_IN): Response {
  return new Response(
    JSON.stringify({ access_token: "tok-abc", expires_in: expiresIn, token_type: "bearer" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

/** Reload so the module-local memo starts empty for each test. */
async function freshModule() {
  vi.resetModules();
  return import("./igdb-token");
}

beforeEach(() => {
  vi.clearAllMocks();
  redisGet.mockResolvedValue(null);
  redisSet.mockResolvedValue("OK");
  redisDel.mockResolvedValue(1);
  process.env.IGDB_CLIENT_ID = "test-client-id";
  process.env.IGDB_CLIENT_SECRET = "test-client-secret";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getIgdbAccessToken", () => {
  it("requests a token on a cold cache and stores it for its reported lifetime", async () => {
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) => tokenResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { getIgdbAccessToken } = await freshModule();

    expect(await getIgdbAccessToken()).toBe("tok-abc");

    const requested = String(fetchMock.mock.calls[0][0]);
    expect(requested).toContain("id.twitch.tv/oauth2/token");
    expect(requested).toContain("grant_type=client_credentials");

    // TTL follows the response rather than a hardcoded window, minus the margin.
    expect(redisSet).toHaveBeenCalledWith(
      "igdb:access-token",
      expect.objectContaining({ token: "tok-abc" }),
      { ex: EXPIRES_IN - MARGIN },
    );
  });

  it("serves repeat calls from memory without touching Twitch or Redis again", async () => {
    const fetchMock = vi.fn(async () => tokenResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { getIgdbAccessToken } = await freshModule();

    await getIgdbAccessToken();
    await getIgdbAccessToken();
    await getIgdbAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redisGet).toHaveBeenCalledTimes(1);
  });

  it("reuses a token cached by another instance", async () => {
    const fetchMock = vi.fn(async () => tokenResponse());
    vi.stubGlobal("fetch", fetchMock);
    redisGet.mockResolvedValue({ token: "shared-tok", expiresAt: Date.now() + 60_000 });
    const { getIgdbAccessToken } = await freshModule();

    expect(await getIgdbAccessToken()).toBe("shared-tok");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores a cached token that has already expired", async () => {
    const fetchMock = vi.fn(async () => tokenResponse());
    vi.stubGlobal("fetch", fetchMock);
    redisGet.mockResolvedValue({ token: "stale-tok", expiresAt: Date.now() - 1_000 });
    const { getIgdbAccessToken } = await freshModule();

    expect(await getIgdbAccessToken()).toBe("tok-abc");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls open when Redis is unreachable", async () => {
    const fetchMock = vi.fn(async () => tokenResponse());
    vi.stubGlobal("fetch", fetchMock);
    redisGet.mockRejectedValue(new Error("redis down"));
    redisSet.mockRejectedValue(new Error("redis down"));
    const { getIgdbAccessToken } = await freshModule();

    // A Redis outage costs an extra token request; it must not break search.
    expect(await getIgdbAccessToken()).toBe("tok-abc");
  });

  it("throws a plain error when credentials are missing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.IGDB_CLIENT_SECRET = "";
    const { getIgdbAccessToken } = await freshModule();

    await expect(getIgdbAccessToken()).rejects.toThrow("IGDB_CLIENT_SECRET is not set");
  });
});

describe("invalidateIgdbToken", () => {
  it("clears both caches so the next call re-authenticates", async () => {
    const fetchMock = vi.fn(async () => tokenResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { getIgdbAccessToken, invalidateIgdbToken } = await freshModule();

    await getIgdbAccessToken();
    await invalidateIgdbToken();
    await getIgdbAccessToken();

    expect(redisDel).toHaveBeenCalledWith("igdb:access-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
