export default function GuildsLoading() {
  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-2xl">Guilds</h1>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">
          Join with an invite code
        </h2>
        <div className="flex animate-pulse gap-2">
          <div className="h-9 flex-1 rounded-md bg-muted" />
          <div className="h-9 w-20 rounded-md bg-muted" />
        </div>
      </section>

      <section className="animate-pulse space-y-3">
        <div className="h-4 w-28 rounded bg-muted" />
        <ul className="space-y-2">
          {[0, 1].map((row) => (
            <li
              key={row}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="size-10 shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 max-w-full rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </div>
              <div className="h-5 w-16 shrink-0 rounded-full bg-muted" />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-pixel text-sm text-muted-foreground uppercase">Create a guild</h2>
        <div className="animate-pulse space-y-2">
          <div className="h-9 w-full rounded-md bg-muted" />
          <div className="h-20 w-full rounded-md bg-muted" />
          <div className="h-9 w-28 rounded-md bg-muted" />
        </div>
      </section>
    </div>
  );
}
