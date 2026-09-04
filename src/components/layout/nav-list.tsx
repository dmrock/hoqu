"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PixelCursor } from "@/components/icons/pixel-cursor";
import { cn } from "@/lib/utils";
import { NavBadge } from "./nav-badge";
import { navGroups } from "./nav-items";

/**
 * The grouped nav shared by the desktop sidebar and the mobile drawer. The
 * active item carries a ▸ cursor that slides between items via `layoutId`;
 * `cursorId` keeps the sidebar's and the drawer's cursors from animating into
 * each other when both are mounted.
 */
export function NavList({
  cursorId,
  expanded = true,
  pendingRequests,
  onNavigate,
}: {
  cursorId: string;
  expanded?: boolean;
  pendingRequests: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {navGroups.map((group, groupIndex) => (
        <ul
          // biome-ignore lint/suspicious/noArrayIndexKey: nav groups are static and ordered
          key={groupIndex}
          className={cn(
            "flex flex-col gap-1",
            groupIndex > 0 && "mt-2 border-t border-sidebar-border pt-2",
          )}
        >
          {group.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const badgeCount = item.href === "/friends" ? pendingRequests : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={expanded ? undefined : item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav relative flex items-center gap-3 rounded-lg py-2 text-sm transition-colors",
                    expanded ? "px-3" : "justify-center px-0",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId={cursorId}
                      transition={{ type: "spring", stiffness: 520, damping: 42 }}
                      className="absolute top-1/2 left-1 -translate-y-1/2 text-primary"
                      aria-hidden
                    >
                      <PixelCursor className="h-2.5 w-1.5" />
                    </motion.span>
                  ) : null}
                  <Icon className="size-5 shrink-0 group-hover/nav:animate-pixel-blink" />
                  {expanded ? <span>{item.label}</span> : null}
                  <NavBadge count={badgeCount} variant={expanded ? "count" : "dot"} />
                </Link>
              </li>
            );
          })}
        </ul>
      ))}
    </>
  );
}
