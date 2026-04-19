import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/books", label: "Books", icon: BookOpen },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/guilds", label: "Guilds", icon: Shield },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];
