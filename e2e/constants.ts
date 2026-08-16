/**
 * The first /explore navigation per run pays the Turbopack first-compile cost
 * (e2e runs against `pnpm dev`, not a prod build), which has been observed to
 * exceed the default 5s expect timeout on CI runners. Bump narrowly at these
 * nav assertions rather than globally so genuine failures still report quickly.
 */
export const FIRST_NAV_TIMEOUT_MS = 15_000;
