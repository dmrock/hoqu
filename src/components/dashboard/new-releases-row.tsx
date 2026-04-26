import Image from "next/image";
import type { SearchResult } from "@/lib/api/search";

export function NewReleasesRow({
  title,
  items,
  emptyHint,
}: {
  title: string;
  items: SearchResult[];
  emptyHint: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="border-l-2 border-accent pl-2 font-mono text-xs text-foreground uppercase tracking-wider">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {items.map((item) => (
            <div key={item.externalId} className="w-28 shrink-0">
              <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs font-medium" title={item.title}>
                {item.title}
              </p>
              {item.year ? <p className="text-xs text-muted-foreground">{item.year}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function NewReleasesSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <h3 className="border-l-2 border-accent pl-2 font-mono text-xs text-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="w-28 shrink-0 animate-pulse">
            <div className="aspect-2/3 rounded-lg bg-muted" />
            <div className="mt-1 h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
