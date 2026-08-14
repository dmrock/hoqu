import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson, UpstreamUnavailableError } from "./upstream";

type FetchInit = RequestInit & { next?: { revalidate: number } };
type FetchArgs = [url: string | URL, init?: FetchInit];

function stubFetch(impl: (...args: FetchArgs) => Promise<Response>) {
  const mock = vi.fn(impl);
  vi.stubGlobal("fetch", mock);
  return mock;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/** Asserts the call rejected, and hands back the error already typed. */
async function rejection(promise: Promise<unknown>): Promise<Error & { provider?: string }> {
  try {
    await promise;
  } catch (err) {
    return err as Error & { provider?: string };
  }
  throw new Error("expected the call to reject, but it resolved");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed body and sends an Accept header", async () => {
    const mock = stubFetch(async () => jsonResponse({ results: [1, 2] }));

    const json = await fetchJson<{ results: number[] }>("https://example.test/x", {
      provider: "TMDB",
      timeoutMs: 1000,
    });

    expect(json.results).toEqual([1, 2]);
    expect(mock.mock.calls[0]?.[1]?.headers).toMatchObject({ Accept: "application/json" });
  });

  it("merges caller headers and forwards the next option", async () => {
    const mock = stubFetch(async () => jsonResponse({}));

    await fetchJson("https://example.test/x", {
      provider: "Open Library",
      timeoutMs: 1000,
      headers: { "User-Agent": "HOQU/0.1" },
      next: { revalidate: 3600 },
    });

    const init = mock.mock.calls[0]?.[1];
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "User-Agent": "HOQU/0.1",
    });
    expect(init?.next).toEqual({ revalidate: 3600 });
  });

  it("aborts a hanging provider once the timeout elapses", async () => {
    // A provider that accepts the connection and then never answers.
    stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );

    // Real AbortSignal.timeout on a very short budget — this asserts the signal
    // is actually wired to the request, not merely constructed.
    const err = await rejection(
      fetchJson("https://example.test/x", { provider: "IGDB", timeoutMs: 20 }),
    );

    expect(err).toBeInstanceOf(UpstreamUnavailableError);
    expect(err.provider).toBe("IGDB");
    expect(err.message).toContain("no response in 20ms");
  });

  it("treats a connection failure as unavailable", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    const err = await rejection(
      fetchJson("https://example.test/x", { provider: "IGDB", timeoutMs: 1000 }),
    );

    expect(err).toBeInstanceOf(UpstreamUnavailableError);
    expect(err.message).toContain("network error");
  });

  it.each([
    [500, "Internal Server Error"],
    [502, "Bad Gateway"],
    [503, "Service Unavailable"],
    [429, "Too Many Requests"],
  ])("treats %i as unavailable", async (status, statusText) => {
    stubFetch(async () => jsonResponse({}, { status, statusText }));

    const err = await rejection(
      fetchJson("https://example.test/x", { provider: "IGDB", timeoutMs: 1000 }),
    );

    expect(err).toBeInstanceOf(UpstreamUnavailableError);
  });

  it.each([
    400, 401, 404,
  ])("treats %i as a plain failure — retrying will not fix it", async (status) => {
    stubFetch(async () => jsonResponse({}, { status, statusText: "Nope" }));

    const err = await rejection(
      fetchJson("https://example.test/x", { provider: "TMDB", timeoutMs: 1000 }),
    );

    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(UpstreamUnavailableError);
    expect(err.message).toContain(String(status));
  });

  it("reports malformed JSON without blaming availability", async () => {
    stubFetch(
      async () =>
        new Response("<html>maintenance</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
    );

    const err = await rejection(
      fetchJson("https://example.test/x", { provider: "Open Library", timeoutMs: 1000 }),
    );

    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(UpstreamUnavailableError);
    expect(err.message).toContain("malformed JSON");
  });
});
