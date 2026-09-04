"use client";

import { motion, useReducedMotion } from "motion/react";

import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PixelProgress } from "@/components/ui/pixel-progress";
import { achievementIcon } from "@/lib/achievement-icons";
import { cn } from "@/lib/utils";

/** Beyond this many cards the entrance delay stops growing, so the tail of a
 *  long grid doesn't sit blank waiting its turn. */
const MAX_STAGGER_STEPS = 12;
const STEP_S = 0.03;

export type AchievementCardData = {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number; unit?: string };
};

export function AchievementCard({ item, index }: { item: AchievementCardData; index: number }) {
  const reduced = useReducedMotion();
  const Icon = achievementIcon(item.icon);

  return (
    <Card asChild variant={item.unlocked ? "accent" : "default"} padding="sm">
      <motion.li
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.18,
          ease: "easeOut",
          delay: Math.min(index, MAX_STAGGER_STEPS) * STEP_S,
        }}
        className={cn("flex gap-3", !item.unlocked && "opacity-70")}
      >
        <IconTile size="lg" tone={item.unlocked ? "solid-accent" : "muted"}>
          <Icon />
        </IconTile>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-tight">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
          {item.unlocked ? (
            <p className="font-mono text-xs text-accent">
              Unlocked
              {item.unlockedAt ? ` ${new Date(item.unlockedAt).toLocaleDateString()}` : ""}
            </p>
          ) : (
            <div className="space-y-1">
              <PixelProgress value={item.progress.current} target={item.progress.target} />
              <p className="font-mono text-xs text-muted-foreground">
                {item.progress.current} / {item.progress.target}
                {item.progress.unit ? ` ${item.progress.unit}` : ""}
              </p>
            </div>
          )}
        </div>
      </motion.li>
    </Card>
  );
}
