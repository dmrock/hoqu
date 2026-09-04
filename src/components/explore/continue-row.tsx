import { PosterTile } from "@/components/ui/poster-tile";
import { SectionHeading } from "@/components/ui/section-heading";
import { HOBBY_META } from "@/lib/hobby-meta";
import type { HobbySlug } from "@/lib/points";

export type ContinueItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  hobbySlug: HobbySlug;
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
      <SectionHeading>Continue</SectionHeading>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((item, i) => (
          <PosterTile
            key={item.id}
            href={`/${item.hobbySlug}?focus=${item.id}`}
            title={item.title}
            imageUrl={item.imageUrl}
            subtitle={HOBBY_META[item.hobbySlug].label}
            // Topmost art on Explore, so these are the LCP candidates.
            eager={i < 4}
          />
        ))}
      </div>
    </section>
  );
}
