import type { AchievementUnlock } from "@/lib/achievements";

export const UNLOCK_EVENT = "hoqu:achievement-unlock";

export type UnlockEventDetail = AchievementUnlock;

export function notifyUnlocks(unlocks: AchievementUnlock[] | undefined): void {
  if (!unlocks || unlocks.length === 0) return;
  if (typeof window === "undefined") return;
  for (const u of unlocks) {
    window.dispatchEvent(new CustomEvent<UnlockEventDetail>(UNLOCK_EVENT, { detail: u }));
  }
}
