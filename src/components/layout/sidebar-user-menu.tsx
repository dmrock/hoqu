"use client";

import { ChevronsUpDown, LogOut, Trophy, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SidebarUserMenuProps = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
  expanded?: boolean;
  /** Called after a Profile link click — useful for closing the mobile drawer. */
  onNavigate?: () => void;
};

export function SidebarUserMenu({
  email,
  name,
  image,
  username,
  expanded = true,
  onNavigate,
}: SidebarUserMenuProps) {
  const initials = (name ?? email).slice(0, 2).toUpperCase();
  const displayName = name ?? email;
  const handle = username ? `@${username}` : email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            expanded ? "" : "justify-center",
          )}
          aria-label="Open profile menu"
        >
          <Avatar className="size-8 shrink-0">
            {image ? <AvatarImage src={image} alt={displayName} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {expanded ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{handle}</p>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align={expanded ? "end" : "start"}
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm">{displayName}</span>
          <span
            className={cn(
              "truncate text-xs font-normal text-muted-foreground",
              expanded ? "" : "font-mono",
            )}
          >
            {expanded ? email : handle}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {username ? (
          <DropdownMenuItem asChild>
            <Link href={`/profile/${username}`} onClick={onNavigate}>
              <UserIcon />
              Profile
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/achievements" onClick={onNavigate}>
            <Trophy />
            Achievements
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
