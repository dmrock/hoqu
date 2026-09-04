"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const COLORS = ["var(--accent)", "var(--primary)", "var(--warning)"];

type Particle = { x: number; y: number; size: number; color: string; delay: number };

function scatter(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 26 + Math.random() * 24;
    return {
      x: Math.round(Math.cos(angle) * dist),
      y: Math.round(Math.sin(angle) * dist),
      size: 3 + Math.round(Math.random() * 2),
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.08,
    };
  });
}

/**
 * One-shot burst of square particles from the center of its (relative)
 * parent. Client-only by nature — particles are randomized per mount, which
 * is fine for toasts that never server-render.
 */
export function PixelBurst({ count = 14 }: { count?: number }) {
  const reduced = useReducedMotion();
  const [particles] = useState(() => scatter(count));
  if (reduced) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {particles.map((p, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: particles are static for the mount
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: p.delay }}
          style={{ position: "absolute", width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </span>
  );
}
