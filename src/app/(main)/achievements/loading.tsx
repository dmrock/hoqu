export default function AchievementsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-pixel text-2xl">Achievements</h1>
        <div className="h-4 w-28 rounded skeleton" />
      </div>

      {[8, 4].map((cards, section) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <section key={section} className="space-y-3">
          <div className="h-4 w-24 rounded skeleton" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: cards }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
              <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <div className="size-12 shrink-0 rounded-lg skeleton" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <div className="h-4 w-24 rounded skeleton" />
                  <div className="h-3 w-full rounded skeleton" />
                  <div className="h-1.5 w-full rounded-full skeleton" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
