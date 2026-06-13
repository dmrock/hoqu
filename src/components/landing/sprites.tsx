import { cn } from "@/lib/utils";

type SpriteProps = {
  className?: string;
};

type PixelArtProps = {
  rows: string[];
  width: number;
  className?: string;
};

// Renders a "#"/"." grid as horizontal-run rects so the markup stays tiny.
// Color comes from a `fill-*` utility on `className`; size from a `size-*` one.
export function PixelArt({ rows, width, className }: PixelArtProps) {
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let runStart: number | null = null;
    for (let x = 0; x <= row.length; x++) {
      const filled = x < row.length && row[x] === "#";
      if (filled && runStart === null) {
        runStart = x;
      } else if (!filled && runStart !== null) {
        rects.push(
          <rect key={`r${y}c${runStart}`} x={runStart} y={y} width={x - runStart} height={1} />,
        );
        runStart = null;
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
      role="presentation"
    >
      <title>pixel icon</title>
      {rects}
    </svg>
  );
}

export function HobbiesSprite({ className }: SpriteProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
      role="presentation"
    >
      <rect x="0" y="0" width="5" height="5" className="fill-primary" />
      <rect x="7" y="0" width="5" height="5" className="fill-accent" />
      <rect x="0" y="7" width="5" height="5" className="fill-warning" />
      <rect x="7" y="7" width="5" height="5" className="fill-foreground" />
    </svg>
  );
}

export function XpSprite({ className }: SpriteProps) {
  return (
    <PixelArt
      className={cn("fill-accent", className)}
      width={12}
      rows={[
        "############",
        "#..........#",
        "#.########.#",
        "#.#......#.#",
        "#.#......#.#",
        ".#.######.#.",
        "..########..",
        "....####....",
        "...######...",
        "..########..",
        ".##########.",
      ]}
    />
  );
}

export function FriendsSprite({ className }: SpriteProps) {
  return (
    <PixelArt
      className={cn("fill-primary", className)}
      width={12}
      rows={[
        "..##....##..",
        ".####..####.",
        ".####..####.",
        "..##....##..",
        "............",
        ".####..####.",
        "############",
        "############",
        "############",
      ]}
    />
  );
}

export function BarsSprite({ className }: SpriteProps) {
  return (
    <PixelArt
      className={cn("fill-warning", className)}
      width={12}
      rows={[
        ".........###",
        ".........###",
        ".........###",
        ".....###.###",
        ".....###.###",
        ".....###.###",
        ".###.###.###",
        ".###.###.###",
        ".###.###.###",
        "############",
      ]}
    />
  );
}

export function LockSprite({ className }: SpriteProps) {
  return (
    <PixelArt
      className={cn("fill-foreground", className)}
      width={12}
      rows={[
        "...######...",
        "..##....##..",
        "..#......#..",
        "..#......#..",
        "############",
        "############",
        "#####..#####",
        "####....####",
        "#####..#####",
        "############",
        "############",
      ]}
    />
  );
}

export function TrophySprite({ className }: SpriteProps) {
  return (
    <PixelArt
      className={cn("fill-accent", className)}
      width={12}
      rows={[
        "############",
        "#.########.#",
        "#.#......#.#",
        "#.#......#.#",
        "#.########.#",
        ".##########.",
        "...######...",
        "....####....",
        "....####....",
        "..########..",
        "############",
      ]}
    />
  );
}
