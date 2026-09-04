"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
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

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
        expanded ? "w-60" : "w-14",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          expanded ? "justify-between px-4" : "flex-col justify-center gap-1",
        )}
      >
        <Logo href="/explore" markOnly={!expanded} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className="text-muted-foreground"
        >
          {expanded ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <NavList
          cursorId="nav-cursor-sidebar"
          expanded={expanded}
          pendingRequests={pendingRequests}
        />
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
