/**
 * Holds the currently-authenticated test user id. The integration setup file
 * wires `requireUserId()` to read this value, so tests can call:
 *
 *   setTestUserId(user.id);
 *   await someServerAction(...);
 *
 * Cleared to null in `beforeEach` so a missing call surfaces as "Unauthorized".
 */
let currentUserId: string | null = null;

export function setTestUserId(id: string | null): void {
  currentUserId = id;
}

export function getTestUserId(): string | null {
  return currentUserId;
}
