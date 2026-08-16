"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavBadge } from "./nav-badge";
import { navGroups } from "./nav-items";
import { SidebarUserMenu } from "./sidebar-user-menu";

type SidebarProps = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
  pendingRequests: number;
};

export function Sidebar({ email, name, image, username, pendingRequests }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
        expanded ? "w-60" : "w-14",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          expanded ? "justify-between" : "justify-center",
        )}
      >
        {expanded && (
          <Link href="/explore" className="font-pixel text-sm text-primary">
            HOQU
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
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
                    title={expanded ? undefined : item.label}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      !expanded && "justify-center px-0",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {expanded && <span>{item.label}</span>}
                    <NavBadge count={badgeCount} variant={expanded ? "count" : "dot"} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <SidebarUserMenu
          email={email}
          name={name}
          image={image}
          username={username}
          expanded={expanded}
        />
      </div>
    </aside>
  );
}
