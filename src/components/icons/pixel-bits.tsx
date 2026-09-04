import type { SVGProps } from "react";

/** Three-pixel glyph used as the bullet on section labels. */
export function PixelBits(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 4 4"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="0" y="0" width="2" height="2" fill="var(--primary)" />
      <rect x="2" y="2" width="2" height="2" fill="var(--primary)" />
      <rect x="2" y="0" width="2" height="2" fill="var(--accent)" />
    </svg>
  );
}
