"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { NavList } from "./nav-list";
import { SidebarUserMenu } from "./sidebar-user-menu";

type MobileDrawerProps = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
  pendingRequests: number;
};

export function MobileDrawer({ email, name, image, username, pendingRequests }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col p-0">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <SheetTitle asChild>
            <div>
              <Logo href="/explore" />
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-2">
          <NavList
            cursorId="nav-cursor-drawer"
            pendingRequests={pendingRequests}
            onNavigate={() => setOpen(false)}
          />
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
