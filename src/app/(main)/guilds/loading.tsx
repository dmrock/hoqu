export default function GuildsLoading() {
  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-2xl">Guilds</h1>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">
          Join with an invite code
        </h2>
        <div className="flex gap-2">
          <div className="h-9 flex-1 rounded-md skeleton" />
          <div className="h-9 w-20 rounded-md skeleton" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="h-4 w-28 rounded skeleton" />
        <ul className="space-y-2">
          {[0, 1].map((row) => (
            <li
              key={row}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="size-10 shrink-0 rounded-lg skeleton" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 max-w-full rounded skeleton" />
                <div className="h-3 w-28 rounded skeleton" />
              </div>
              <div className="h-5 w-16 shrink-0 rounded-full skeleton" />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Create a guild</h2>
        <div className="space-y-2">
          <div className="h-9 w-full rounded-md skeleton" />
          <div className="h-20 w-full rounded-md skeleton" />
          <div className="h-9 w-28 rounded-md skeleton" />
        </div>
      </section>
    </div>
  );
}
