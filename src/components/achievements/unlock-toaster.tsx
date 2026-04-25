"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { achievementIcon } from "@/lib/achievement-icons";
import type { AchievementUnlock } from "@/lib/achievements";
import { UNLOCK_EVENT, type UnlockEventDetail } from "@/lib/notify-unlocks";

const VISIBLE_MS = 5000;

type Toast = AchievementUnlock & { key: number };

export function UnlockToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onUnlock(e: Event) {
      const detail = (e as CustomEvent<UnlockEventDetail>).detail;
      if (!detail) return;
      const key = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...detail, key }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== key));
      }, VISIBLE_MS);
    }
    window.addEventListener(UNLOCK_EVENT, onUnlock);
    return () => window.removeEventListener(UNLOCK_EVENT, onUnlock);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = achievementIcon(t.icon);
          return (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto flex w-72 items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-lg ring-1 ring-accent/30"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-pixel text-[0.7rem] text-accent">Achievement unlocked</p>
                <p className="truncate font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.description}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
