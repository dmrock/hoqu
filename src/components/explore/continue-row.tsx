import Image from "next/image";
import Link from "next/link";
import type { HobbySlug } from "@/lib/points";

export type ContinueItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  hobbySlug: HobbySlug;
};

const HOBBY_LABEL: Record<HobbySlug, string> = {
  movies: "Movies",
  tv: "TV Shows",
  games: "Games",
  books: "Books",
};

/**
 * In-progress items, newest first. Each card deep-links to the item's row via
 * the same `?focus=` mechanism the Cmd+K palette uses, so the row is scrolled
 * to and highlighted on arrival.
 */
export function ContinueRow({ items }: { items: ContinueItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-pixel text-sm text-muted-foreground uppercase">Continue</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((item, i) => (
          <Link
            key={item.id}
            href={`/${item.hobbySlug}?focus=${item.id}`}
            className="group min-w-0 text-left"
          >
            <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted ring-1 ring-transparent transition-all group-hover:ring-primary group-focus-visible:ring-primary">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 640px) 160px, 33vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  // Topmost art on Explore, so these are the LCP candidates.
                  loading={i < 4 ? "eager" : undefined}
                />
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs font-medium" title={item.title}>
              {item.title}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              {HOBBY_LABEL[item.hobbySlug]}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
