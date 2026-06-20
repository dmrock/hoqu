import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "./tokens-crypto";

describe("generateToken", () => {
  it("is URL-safe base64 with no padding", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("produces a unique value each call", () => {
    const seen = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(seen.size).toBe(100);
  });

  it("carries 256 bits of entropy (43-char base64url)", () => {
    expect(generateToken()).toHaveLength(43);
  });
});

describe("hashToken", () => {
  it("is a deterministic 64-char hex sha256 digest", () => {
    const hash = hashToken("some-raw-token");
    expect(hash).toBe(hashToken("some-raw-token"));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different inputs", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});
