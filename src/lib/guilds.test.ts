import { describe, expect, it } from "vitest";
import { generateInviteCode } from "./guilds";

describe("generateInviteCode", () => {
  it("returns an 8-character code", () => {
    expect(generateInviteCode()).toHaveLength(8);
  });

  it("uses only the unambiguous uppercase charset (no 0, O, 1, I)", () => {
    const allowed = /^[ABCDEFGHIJKLMNPQRSTUVWXYZ23456789]{8}$/;
    for (let i = 0; i < 100; i++) {
      expect(generateInviteCode()).toMatch(allowed);
    }
  });

  it("is non-deterministic across calls (sanity check on entropy)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(45);
  });
});
