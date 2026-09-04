import type { SVGProps } from "react";

// 7×7 pixel gem. Three shades of --primary plus one mint sparkle, drawn as
// rects so it stays crisp at any size (`shape-rendering: crispEdges`).
const LIGHT = "#b39dff";
const BASE = "var(--primary)";
const DARK = "#5a3fd6";
const SPARK = "var(--accent)";

const PIXELS: [number, number, string][] = [
  [2, 0, LIGHT],
  [3, 0, LIGHT],
  [4, 0, LIGHT],
  [1, 1, LIGHT],
  [2, 1, SPARK],
  [3, 1, BASE],
  [4, 1, BASE],
  [5, 1, DARK],
  [0, 2, LIGHT],
  [1, 2, BASE],
  [2, 2, BASE],
  [3, 2, BASE],
  [4, 2, BASE],
  [5, 2, DARK],
  [6, 2, DARK],
  [0, 3, BASE],
  [1, 3, BASE],
  [2, 3, BASE],
  [3, 3, BASE],
  [4, 3, DARK],
  [5, 3, DARK],
  [6, 3, DARK],
  [1, 4, BASE],
  [2, 4, BASE],
  [3, 4, DARK],
  [4, 4, DARK],
  [5, 4, DARK],
  [2, 5, BASE],
  [3, 5, DARK],
  [4, 5, DARK],
  [3, 6, DARK],
];

/** The HOQU mark: a pixel-art XP gem. */
export function PixelMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PIXELS.map(([x, y, fill]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />
      ))}
    </svg>
  );
}
