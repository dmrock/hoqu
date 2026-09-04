import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

/** Matches the seeded shape of the real page (7 categories × 4 achievements),
 *  so the grid doesn't reflow when the data lands. */
const CATEGORIES = 7;
const CARDS_PER_CATEGORY = 4;

export default function AchievementsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Achievements"
        description="Badges unlock on their own as your log grows."
        actions={<div className="h-4 w-44 rounded skeleton" />}
      />

      {Array.from({ length: CATEGORIES }, (_, section) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <section key={section} className="space-y-3">
          <div className="h-3 w-24 rounded skeleton" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: CARDS_PER_CATEGORY }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <Card key={i} asChild padding="sm">
                <li className="flex gap-3">
                  <div className="size-12 shrink-0 rounded-lg skeleton" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="h-5 w-28 rounded skeleton" />
                    <div className="h-4 w-full rounded skeleton" />
                    {/* Square, like PixelProgress — the real bar has no radius. */}
                    <div className="h-2 w-full skeleton" />
                    <div className="h-4 w-12 rounded skeleton" />
                  </div>
                </li>
              </Card>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
