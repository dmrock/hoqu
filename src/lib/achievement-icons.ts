import {
  BookOpen,
  Clapperboard,
  Compass,
  Crown,
  Film,
  Flame,
  Gamepad2,
  type LucideIcon,
  Map as MapIcon,
  ScrollText,
  Sparkles,
  Star,
  Trophy,
  Tv,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  sparkle: Sparkles,
  "film-badge": Film,
  "tv-badge": Tv,
  "gamepad-badge": Gamepad2,
  "book-badge": BookOpen,
  reel: Clapperboard,
  remote: Tv,
  "controller-gold": Gamepad2,
  scroll: ScrollText,
  compass: Compass,
  map: MapIcon,
  crown: Crown,
  flame: Flame,
  stars: Star,
};

export function achievementIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Trophy;
}
