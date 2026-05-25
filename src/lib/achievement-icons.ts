import {
  Antenna,
  BadgeCheck,
  BookMarked,
  BookOpen,
  Castle,
  Clapperboard,
  Compass,
  Crown,
  Drama,
  Film,
  Flame,
  Footprints,
  Gamepad2,
  Gavel,
  GraduationCap,
  Joystick,
  Library,
  type LucideIcon,
  Map as MapIcon,
  MonitorPlay,
  Mountain,
  Popcorn,
  ScrollText,
  Star,
  Stars,
  Swords,
  Target,
  Trophy,
  Tv,
  Tv2,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  // General
  footprints: Footprints,
  map: MapIcon,
  compass: Compass,
  "graduation-cap": GraduationCap,
  // Milestones
  crown: Crown,
  castle: Castle,
  flame: Flame,
  mountain: Mountain,
  // Ratings
  star: Star,
  stars: Stars,
  "badge-check": BadgeCheck,
  gavel: Gavel,
  // Movies
  film: Film,
  clapperboard: Clapperboard,
  drama: Drama,
  popcorn: Popcorn,
  // TV
  tv: Tv,
  "tv-2": Tv2,
  "monitor-play": MonitorPlay,
  antenna: Antenna,
  // Games
  gamepad: Gamepad2,
  joystick: Joystick,
  target: Target,
  swords: Swords,
  // Books
  "book-open": BookOpen,
  scroll: ScrollText,
  library: Library,
  "book-marked": BookMarked,
};

export function achievementIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Trophy;
}
