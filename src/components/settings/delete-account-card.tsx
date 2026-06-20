"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountCard({ username }: { username: string }) {
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      // On success the action signs out and redirects, so control won't return
      // here; only a failure resolves with a result to surface.
      const res = await deleteAccountAction({ confirmUsername });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="rounded-xl border border-destructive/40 bg-card p-6">
      <h2 className="font-pixel text-sm uppercase text-destructive">Danger zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account and all of your logged items, achievements, friendships and
        guild memberships. This can't be undone.
      </p>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="mt-4">
            Delete account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently erases your data. Type your username{" "}
              <span className="font-mono text-foreground">{username}</span> to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-username">Username</Label>
            <Input
              id="confirm-username"
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
              autoComplete="off"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting || confirmUsername !== username}
            >
              {submitting ? "Deleting…" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
