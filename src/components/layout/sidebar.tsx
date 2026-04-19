"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar() {
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
          <Link href="/dashboard" className="font-pixel text-sm text-primary">
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
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={expanded ? undefined : item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    !expanded && "justify-center px-0",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {expanded && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
