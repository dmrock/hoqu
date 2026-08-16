"use client";

import { MotionConfig } from "motion/react";

/**
 * `reducedMotion="user"` makes every Motion component in the tree honour the
 * OS "reduce motion" setting without each one checking for itself.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
