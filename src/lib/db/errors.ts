const UNIQUE_VIOLATION = "23505";

// Enough to unwrap DrizzleQueryError → NeonDbError; also bounds circular causes.
const MAX_CAUSE_DEPTH = 5;

type PgErrorLike = { code?: unknown; constraint?: unknown; cause?: unknown };

/**
 * True when `err` is a Postgres unique-constraint violation (SQLSTATE 23505),
 * optionally on one named constraint. Walks the `cause` chain because drizzle
 * wraps the driver's NeonDbError in a DrizzleQueryError.
 */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  let e = err;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && typeof e === "object" && e !== null; depth++) {
    const { code, constraint: violated, cause } = e as PgErrorLike;
    if (code === UNIQUE_VIOLATION) {
      return constraint === undefined || violated === constraint;
    }
    e = cause;
  }
  return false;
}
