"use client";

import { motion } from "motion/react";

/**
 * One-shot entrance for a block of content. Takes `children` so the wrapped
 * subtree stays server-rendered — nothing inside is pulled into the client
 * bundle just to animate its container.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
