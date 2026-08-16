"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { updateShowSeasons } from "@/app/(main)/items/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { notifyUnlocks } from "@/lib/notify-unlocks";
import type { ItemStatus } from "@/lib/points";
import type { ItemRow } from "@/types/item";

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "planned", label: "Planned" },
  { value: "dropped", label: "Dropped" },
];

/** The value every season already shares, or null when they disagree. */
function sharedValue<T>(seasons: ItemRow[], pick: (season: ItemRow) => T): T | null {
  if (seasons.length === 0) return null;
  const first = pick(seasons[0]);
  return seasons.every((s) => pick(s) === first) ? first : null;
}

export function EditShowSeasons({ item }: { item: ItemRow }) {
  const seasons = item.children ?? [];
  const [open, setOpen] = useState(false);
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Each field is opt-in: unticked means "leave every season as it is", so a
  // rating can be set across a show without flattening per-season statuses.
  const [applyStatus, setApplyStatus] = useState(false);
  const [applyRating, setApplyRating] = useState(false);
  const [applyNote, setApplyNote] = useState(false);
  const [applyRevisit, setApplyRevisit] = useState(false);

  const [status, setStatus] = useState<ItemStatus>(
    sharedValue(seasons, (s) => s.status) ?? "completed",
  );
  const [userRating, setUserRating] = useState<string>(() => {
    const shared = sharedValue(seasons, (s) => s.userRating);
    return shared ? String(shared) : "none";
  });
  const [note, setNote] = useState(sharedValue(seasons, (s) => s.note) ?? "");
  const [wouldRevisit, setWouldRevisit] = useState(
    sharedValue(seasons, (s) => s.wouldRevisit) ?? false,
  );

  const nothingTicked = !applyStatus && !applyRating && !applyNote && !applyRevisit;

  function close() {
    setOpen(false);
    setError(null);
    setApplyStatus(false);
    setApplyRating(false);
    setApplyNote(false);
    setApplyRevisit(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nothingTicked) return;
    setError(null);
    startTransition(async () => {
      const res = await updateShowSeasons({
        itemId: item.id,
        ...(applyStatus ? { status } : {}),
        ...(applyRating ? { userRating: userRating === "none" ? null : Number(userRating) } : {}),
        ...(applyNote ? { note: note.trim() ? note.trim() : null } : {}),
        ...(applyRevisit ? { wouldRevisit } : {}),
      });
      if (res.ok) {
        notifyUnlocks(res.unlocks);
        close();
      } else setError(res.error);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit all seasons"
        onClick={() => setOpen(true)}
      >
        <Pencil />
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit all seasons</DialogTitle>
              <DialogDescription>
                Only the fields you tick are written to every season of “{item.title}”.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`apply-status-${item.id}`}
                  checked={applyStatus}
                  onChange={(e) => setApplyStatus(e.target.checked)}
                />
                <Label htmlFor={`apply-status-${item.id}`}>Status</Label>
              </div>
              <Select
                value={status}
                disabled={!applyStatus}
                onValueChange={(v) => setStatus(v as ItemStatus)}
              >
                <SelectTrigger aria-label="Status for every season">
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`apply-rating-${item.id}`}
                  checked={applyRating}
                  onChange={(e) => setApplyRating(e.target.checked)}
                />
                <Label htmlFor={`apply-rating-${item.id}`}>Your rating</Label>
              </div>
              <Select value={userRating} disabled={!applyRating} onValueChange={setUserRating}>
                <SelectTrigger aria-label="Rating for every season">
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`apply-note-${item.id}`}
                  checked={applyNote}
                  onChange={(e) => setApplyNote(e.target.checked)}
                />
                <Label htmlFor={`apply-note-${item.id}`}>Note</Label>
              </div>
              <Textarea
                aria-label="Note for every season"
                maxLength={500}
                disabled={!applyNote}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`apply-revisit-${item.id}`}
                  checked={applyRevisit}
                  onChange={(e) => setApplyRevisit(e.target.checked)}
                />
                <Label htmlFor={`apply-revisit-${item.id}`}>Again?</Label>
              </div>
              <Select
                value={wouldRevisit ? "yes" : "no"}
                disabled={!applyRevisit}
                onValueChange={(v) => setWouldRevisit(v === "yes")}
              >
                <SelectTrigger aria-label="Again for every season">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || nothingTicked}>
                {submitting ? "Saving..." : "Apply to all seasons"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
