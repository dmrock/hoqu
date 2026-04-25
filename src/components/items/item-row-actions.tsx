"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteItem, updateItem } from "@/app/(main)/items/actions";
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
import type { ItemStatus } from "@/lib/points";
import type { ItemRow } from "@/types/item";

type Mode = "none" | "edit" | "delete";

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "planned", label: "Planned" },
  { value: "dropped", label: "Dropped" },
];

export function ItemRowActions({
  item,
  showEdit = true,
  deleteDescription,
}: {
  item: ItemRow;
  showEdit?: boolean;
  deleteDescription?: string;
}) {
  const [mode, setMode] = useState<Mode>("none");
  const [status, setStatus] = useState<ItemStatus>(item.status ?? "planned");
  const [userRating, setUserRating] = useState<string>(
    item.userRating ? String(item.userRating) : "none",
  );
  const [note, setNote] = useState(item.note ?? "");
  const [wouldRevisit, setWouldRevisit] = useState(item.wouldRevisit);
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setMode("none");
    setError(null);
    setStatus(item.status ?? "planned");
    setUserRating(item.userRating ? String(item.userRating) : "none");
    setNote(item.note ?? "");
    setWouldRevisit(item.wouldRevisit);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateItem({
        itemId: item.id,
        status,
        userRating: userRating === "none" ? null : Number(userRating),
        note: note.trim() ? note.trim() : null,
        wouldRevisit,
      });
      if (res.ok) close();
      else setError(res.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteItem({ itemId: item.id });
      if (res.ok) close();
      else setError(res.error);
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {showEdit ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit item"
            onClick={() => setMode("edit")}
          >
            <Pencil />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete item"
          className="text-destructive hover:text-destructive"
          onClick={() => setMode("delete")}
        >
          <Trash2 />
        </Button>
      </div>

      <Dialog open={mode !== "none"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          {mode === "edit" ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit item</DialogTitle>
                <DialogDescription className="sr-only">
                  Update status, rating, and note.
                </DialogDescription>
              </DialogHeader>
              <p className="font-medium">{item.title}</p>
              <div className="space-y-2">
                <Label htmlFor={`status-${item.id}`}>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
                  <SelectTrigger id={`status-${item.id}`}>
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
                <Label htmlFor={`rating-${item.id}`}>Your rating</Label>
                <Select value={userRating} onValueChange={setUserRating}>
                  <SelectTrigger id={`rating-${item.id}`}>
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
                <Label htmlFor={`note-${item.id}`}>Note (optional)</Label>
                <Textarea
                  id={`note-${item.id}`}
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
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          ) : mode === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete item?</DialogTitle>
                <DialogDescription>
                  {deleteDescription ??
                    `Remove "${item.title}" from your collection. This cannot be undone.`}
                </DialogDescription>
              </DialogHeader>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
