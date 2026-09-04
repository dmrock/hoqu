import type { SVGProps } from "react";

/** The ▸ menu cursor from every RPG that ever shipped: 3×5 pixels. */
export function PixelCursor(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 3 5"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M0 0h1v5H0zM1 1h1v3H1zM2 2h1v1H2z" fill="currentColor" />
    </svg>
  );
}
