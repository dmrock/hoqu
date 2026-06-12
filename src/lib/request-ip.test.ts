import { describe, expect, it } from "vitest";
import { clientIpFrom } from "./request-ip";

describe("clientIpFrom", () => {
  it("takes the first hop from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIpFrom(headers)).toBe("203.0.113.7");
  });

  it("trims whitespace around the forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "  203.0.113.7  ,10.0.0.1" });
    expect(clientIpFrom(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(clientIpFrom(headers)).toBe("198.51.100.4");
  });

  it("ignores an empty x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "", "x-real-ip": "198.51.100.4" });
    expect(clientIpFrom(headers)).toBe("198.51.100.4");
  });

  it("returns unknown when no client-address headers are present", () => {
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
