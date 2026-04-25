"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { addItem } from "@/app/(main)/items/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SearchResponse, SearchResult } from "@/lib/api/search";
import { notifyUnlocks } from "@/lib/notify-unlocks";
import type { HobbySlug, ItemStatus } from "@/lib/points";

type Props = {
  hobbySlug: HobbySlug;
  existingExternalIds: string[];
};

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "planned", label: "Planned" },
  { value: "dropped", label: "Dropped" },
];

const HOBBY_SINGULAR: Record<HobbySlug, string> = {
  movies: "movie",
  tv: "TV show",
  games: "game",
  books: "book",
};

export function AddItemDialog({ hobbySlug, existingExternalIds }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState<ItemStatus>("completed");
  const [userRating, setUserRating] = useState<string>("none");
  const [note, setNote] = useState("");
  const [wouldRevisit, setWouldRevisit] = useState(false);
  const [submitting, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const ownedSet = useMemo(() => new Set(existingExternalIds), [existingExternalIds]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced || selected) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    fetch(`/api/search/${hobbySlug}?q=${encodeURIComponent(debounced)}`)
      .then((r) => r.json() as Promise<SearchResponse>)
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setSearchError(json.error);
          setResults([]);
        } else {
          setResults(json.data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchError("Search failed");
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, hobbySlug, selected]);

  function reset() {
    setQuery("");
    setDebounced("");
    setResults([]);
    setSearchError(null);
    setSelected(null);
    setStatus("completed");
    setUserRating("none");
    setNote("");
    setWouldRevisit(false);
    setSubmitError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitError(null);
    startTransition(async () => {
      const res = await addItem({
        hobbySlug,
        externalId: selected.externalId,
        title: selected.title,
        imageUrl: selected.imageUrl,
        year: selected.year,
        externalRating: selected.externalRating,
        status,
        userRating: userRating === "none" ? null : Number(userRating),
        note: note.trim() ? note.trim() : null,
        wouldRevisit,
      });
      if (res.ok) {
        notifyUnlocks(res.unlocks);
        handleOpenChange(false);
      } else {
        setSubmitError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {selected ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add to collection</DialogTitle>
              <DialogDescription className="sr-only">
                Configure status, rating, and note.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-muted">
                {selected.imageUrl ? (
                  <Image
                    src={selected.imageUrl}
                    alt={selected.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-medium">{selected.title}</p>
                {selected.year ? (
                  <p className="text-sm text-muted-foreground">{selected.year}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Your rating</Label>
              <Select value={userRating} onValueChange={setUserRating}>
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No rating</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wouldRevisit}
                onChange={(e) => setWouldRevisit(e.target.checked)}
              />
              Again?
            </label>
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Find a {HOBBY_SINGULAR[hobbySlug]}</DialogTitle>
              <DialogDescription className="sr-only">
                Search external catalogs to add an item.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {searching && <p className="text-sm text-muted-foreground">Searching...</p>}
              {searchError && <p className="text-sm text-destructive">{searchError}</p>}
              {!searching && !searchError && results.length === 0 && debounced && (
                <p className="text-sm text-muted-foreground">No results.</p>
              )}
              {results.map((r) => {
                const owned = ownedSet.has(r.externalId);
                return (
                  <button
                    key={r.externalId}
                    type="button"
                    disabled={owned}
                    onClick={() => setSelected(r)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                      {r.imageUrl ? (
                        <Image
                          src={r.imageUrl}
                          alt={r.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{r.title}</p>
                      {r.year && <p className="text-xs text-muted-foreground">{r.year}</p>}
                    </div>
                    {owned && <Badge variant="secondary">Owned</Badge>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
