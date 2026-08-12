/**
 * Interactive search — the user is watching a spinner, so give up early and let
 * them retype rather than holding the request open.
 */
export const SEARCH_TIMEOUT_MS = 5_000;

/**
 * Dashboard "new releases" rows. Server-rendered inside `<Suspense>` behind a
 * `revalidate` window, so nobody is blocked on the result and a slower upstream
 * is worth waiting out.
 */
export const BACKGROUND_TIMEOUT_MS = 10_000;

/**
 * The provider is reachable-but-not-answering (timed out, refused, throttled,
 * 5xx) rather than misconfigured. Callers distinguish this to tell users "try
 * again in a moment" instead of surfacing a generic failure — a bad API key and
 * a dead origin need very different responses.
 */
export class UpstreamUnavailableError extends Error {
  constructor(
    readonly provider: string,
    detail: string,
    options?: { cause?: unknown },
  ) {
    super(`${provider} unavailable: ${detail}`, options);
    this.name = "UpstreamUnavailableError";
  }
}

/** `AbortSignal.timeout()` rejects with TimeoutError; a caller-side abort gives AbortError. */
function isAbortLike(err: unknown): err is Error {
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

type FetchJsonOptions = {
  /** Human-readable provider name, used in error messages and logs. */
  provider: string;
  timeoutMs: number;
  headers?: Record<string, string>;
  next?: { revalidate: number };
};

/**
 * Shared JSON fetch for the external search providers: applies a timeout and
 * normalizes "provider is down" into {@link UpstreamUnavailableError}.
 *
 * Passing a signal opts the request out of Next's per-render memoization but
 * leaves the persistent data cache (`next.revalidate`) intact — the two are
 * separate layers, and nothing here fetches the same URL twice in one pass.
 */
export async function fetchJson<T>(url: URL | string, opts: FetchJsonOptions): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json", ...opts.headers },
      signal: AbortSignal.timeout(opts.timeoutMs),
      ...(opts.next ? { next: opts.next } : {}),
    });
  } catch (err) {
    // DNS/TCP failures arrive as TypeError, timeouts as TimeoutError. Both mean
    // the same thing to a caller: nobody answered.
    const detail = isAbortLike(err) ? `no response in ${opts.timeoutMs}ms` : "network error";
    throw new UpstreamUnavailableError(opts.provider, detail, { cause: err });
  }

  if (!res.ok) {
    // 429 and 5xx are transient; 4xx means we sent something wrong (usually a
    // bad or missing key), which retrying will not fix.
    if (res.status === 429 || res.status >= 500) {
      throw new UpstreamUnavailableError(opts.provider, `${res.status} ${res.statusText}`);
    }
    throw new Error(`${opts.provider} request failed: ${res.status} ${res.statusText}`);
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    // The timeout also covers the body read, so a slow-trickling response lands
    // here rather than in the fetch catch above.
    if (isAbortLike(err)) {
      throw new UpstreamUnavailableError(opts.provider, "response body timed out", { cause: err });
    }
    throw new Error(`${opts.provider} returned malformed JSON`);
  }
}
