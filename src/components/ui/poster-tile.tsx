import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PosterTileProps = {
  title: string;
  imageUrl: string | null;
  /** Small mono caption under the title (hobby, year). */
  subtitle?: React.ReactNode;
  /** Extra lines under the subtitle. */
  meta?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  /** Pinned inside the poster (an "Owned" badge, a rating). */
  badge?: React.ReactNode;
  /** Shown over the poster on hover/focus, e.g. a "+" button. */
  overlay?: React.ReactNode;
  /** Set on above-the-fold posters so they win LCP. */
  eager?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * 2:3 poster with title/caption, used by Explore, the trending feeds and the
 * profile. Interactive when given `href` or `onClick`: lifts, rings in the
 * brand color and zooms the art a touch on hover.
 */
export function PosterTile({
  title,
  imageUrl,
  subtitle,
  meta,
  href,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
  badge,
  overlay,
  eager = false,
  sizes = "(min-width: 640px) 160px, 33vw",
  className,
}: PosterTileProps) {
  const interactive = !disabled && (Boolean(href) || Boolean(onClick));

  const body = (
    <>
      <div
        className={cn(
          "relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-1 ring-white/5 transition-[transform,box-shadow] duration-200",
          interactive &&
            "group-hover:-translate-y-0.5 group-hover:shadow-glow group-focus-visible:-translate-y-0.5 group-focus-visible:shadow-glow",
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes={sizes}
            loading={eager ? "eager" : undefined}
            className={cn(
              "object-cover transition-transform duration-300",
              interactive && "group-hover:scale-[1.04] group-focus-visible:scale-[1.04]",
            )}
          />
        ) : (
          <div className="absolute inset-0 pixel-grid" />
        )}
        {badge}
        {interactive && overlay ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all duration-200 group-hover:bg-background/55 group-hover:opacity-100 group-focus-visible:bg-background/55 group-focus-visible:opacity-100">
            {overlay}
          </div>
        ) : null}
      </div>
      <p className="mt-1.5 truncate text-xs font-medium" title={title}>
        {title}
      </p>
      {subtitle ? (
        <p className="truncate font-mono text-[10px] text-muted-foreground uppercase">{subtitle}</p>
      ) : null}
      {meta}
    </>
  );

  const rootClass = cn(
    "group block min-w-0 text-left outline-none",
    disabled && "cursor-not-allowed opacity-60",
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} aria-label={ariaLabel} className={rootClass}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(rootClass, !disabled && "cursor-pointer")}
      >
        {body}
      </button>
    );
  }
  return <div className={rootClass}>{body}</div>;
}
