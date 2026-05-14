import { Footprints, Gamepad2, Trophy } from "lucide-react";
import { describe, expect, it } from "vitest";
import { achievementIcon } from "./achievement-icons";

describe("achievementIcon", () => {
  it("returns the mapped icon for a known slug", () => {
    expect(achievementIcon("footprints")).toBe(Footprints);
    expect(achievementIcon("gamepad-badge")).toBe(Gamepad2);
  });

  it("falls back to Trophy for unknown slugs", () => {
    expect(achievementIcon("does-not-exist")).toBe(Trophy);
    expect(achievementIcon("")).toBe(Trophy);
  });
});
