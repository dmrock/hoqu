import { describe, expect, it } from "vitest";
import { minutesUntilReset } from "./rate-limit-format";

describe("minutesUntilReset", () => {
  const now = 1_000_000_000_000;

  it("returns null when the limiter reported no reset", () => {
    expect(minutesUntilReset(null, now)).toBeNull();
  });

  it("rounds partial minutes up", () => {
    expect(minutesUntilReset(now + 61_000, now)).toBe(2);
    expect(minutesUntilReset(now + 5 * 60_000, now)).toBe(5);
  });

  it("floors at 1 for sub-minute and already-elapsed resets", () => {
    expect(minutesUntilReset(now + 10_000, now)).toBe(1);
    expect(minutesUntilReset(now, now)).toBe(1);
    expect(minutesUntilReset(now - 60_000, now)).toBe(1);
  });
});
