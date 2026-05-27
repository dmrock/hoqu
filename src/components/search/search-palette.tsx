"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { type SearchHit, searchCollection } from "@/app/(main)/search/actions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { HobbySlug } from "@/lib/points";

const HOBBY_LABEL: Record<HobbySlug, string> = {
  movies: "Movies",
  tv: "TV Shows",
  games: "Games",
  books: "Books",
};

const HOBBY_ORDER: HobbySlug[] = ["movies", "tv", "games", "books"];

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setHits([]);
      return;
    }
    const id = setTimeout(() => {
      startTransition(async () => {
        const result = await searchCollection(trimmed);
        if (result.ok) setHits(result.hits);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, open]);

  function select(hit: SearchHit) {
    setOpen(false);
    router.push(`/${hit.hobbySlug}?focus=${hit.id}`);
  }

  const grouped = HOBBY_ORDER.map((slug) => ({
    slug,
    items: hits.filter((h) => h.hobbySlug === slug),
  })).filter((g) => g.items.length > 0);

  const trimmed = query.trim();
  const showHint = trimmed.length < MIN_QUERY_LENGTH;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search your collection"
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
          <span>⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search your collection"
        description="Find items you've already added"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search your collection..."
        />
        <CommandList>
          {showHint ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Start typing to search
            </div>
          ) : (
            <CommandEmpty>No matches in your collection.</CommandEmpty>
          )}
          {grouped.map((group) => (
            <CommandGroup key={group.slug} heading={HOBBY_LABEL[group.slug]}>
              {group.items.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`${hit.title}-${hit.id}`}
                  onSelect={() => select(hit)}
                  className="gap-3"
                >
                  <div
                    className="relative shrink-0 overflow-hidden rounded bg-muted"
                    style={{ width: 28, height: 42 }}
                  >
                    {hit.imageUrl ? (
                      <Image src={hit.imageUrl} alt="" fill sizes="28px" className="object-cover" />
                    ) : null}
                  </div>
                  <span className="min-w-0 flex-1 truncate">{hit.title}</span>
                  {hit.year ? (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{hit.year}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
