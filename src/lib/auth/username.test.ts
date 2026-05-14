import { describe, expect, it } from "vitest";
import { slugifyEmail } from "./username";

describe("slugifyEmail", () => {
  it("uses the local part and lowercases", () => {
    expect(slugifyEmail("Denis@example.com")).toBe("denis");
  });

  it("replaces runs of non-alphanumerics with single dashes", () => {
    expect(slugifyEmail("denis.rork+test@example.com")).toBe("denis-rork-test");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugifyEmail("---foo---@example.com")).toBe("foo");
  });

  it("preserves digits", () => {
    expect(slugifyEmail("user123@example.com")).toBe("user123");
  });

  it("falls back to 'user' for empty local parts", () => {
    expect(slugifyEmail("@example.com")).toBe("user");
  });

  it("falls back to 'user' when local part is only symbols", () => {
    expect(slugifyEmail("!!!@example.com")).toBe("user");
  });

  it("handles missing @ by treating whole string as local part", () => {
    expect(slugifyEmail("noatsign")).toBe("noatsign");
  });
});
