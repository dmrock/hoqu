"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav-items";
import { SidebarUserMenu } from "./sidebar-user-menu";

type MobileDrawerProps = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
};

export function MobileDrawer({ email, name, image, username }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col p-0">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <SheetTitle className="font-pixel text-sm text-primary">HOQU</SheetTitle>
        </SheetHeader>
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
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span>{item.label}</span>
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
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
