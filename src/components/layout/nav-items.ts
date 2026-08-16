import {
  BookOpen,
  Clapperboard,
  Compass,
  Gamepad2,
  type LucideIcon,
  Shield,
  Tv,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Sidebar navigation grouped by purpose. Each inner array is a visual group
 * separated from the next by a horizontal divider in the sidebar / drawer.
 */
export const navGroups: NavItem[][] = [
  [{ href: "/explore", label: "Explore", icon: Compass }],
  [
    { href: "/movies", label: "Movies", icon: Clapperboard },
    { href: "/tv", label: "TV Shows", icon: Tv },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/books", label: "Books", icon: BookOpen },
  ],
  [
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/guilds", label: "Guilds", icon: Shield },
  ],
];
