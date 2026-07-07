import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./errors";

function pgError(code: string, constraint?: string): Error {
  return Object.assign(new Error("db error"), { code, constraint });
}

describe("isUniqueViolation", () => {
  it("detects a bare driver error with code 23505", () => {
    expect(isUniqueViolation(pgError("23505"))).toBe(true);
  });

  it("unwraps the cause chain drizzle wraps driver errors in", () => {
    const wrapped = new Error("Failed query: insert into users", {
      cause: pgError("23505", "users_email_unique"),
    });
    expect(isUniqueViolation(wrapped)).toBe(true);
    expect(isUniqueViolation(wrapped, "users_email_unique")).toBe(true);
  });

  it("filters by constraint name when one is given", () => {
    const err = pgError("23505", "users_username_unique");
    expect(isUniqueViolation(err, "users_username_unique")).toBe(true);
    expect(isUniqueViolation(err, "users_email_unique")).toBe(false);
  });

  it("rejects other SQLSTATEs and non-error values", () => {
    expect(isUniqueViolation(pgError("23503"))).toBe(false);
    expect(isUniqueViolation(new Error("plain"))).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });

  it("terminates on circular cause chains", () => {
    const circular = new Error("a");
    circular.cause = circular;
    expect(isUniqueViolation(circular)).toBe(false);
  });
});
