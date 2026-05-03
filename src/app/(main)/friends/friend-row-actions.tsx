"use client";

import { Check, UserMinus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "./actions";

type Mode = "incoming" | "outgoing" | "friends";

export function FriendRowActions({
  friendshipId,
  mode,
  friendName,
}: {
  friendshipId: string;
  mode: Mode;
  friendName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) setConfirmOpen(false);
    });
  }

  if (mode === "incoming") {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => acceptFriendRequest({ friendshipId }))}
        >
          <Check />
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(() => declineFriendRequest({ friendshipId }))}
        >
          <X />
          Decline
        </Button>
      </div>
    );
  }

  if (mode === "outgoing") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => cancelFriendRequest({ friendshipId }))}
      >
        <X />
        Cancel
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
      >
        <UserMinus />
        Remove
      </Button>
      <Dialog open={confirmOpen} onOpenChange={(o) => !pending && setConfirmOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove friend?</DialogTitle>
            <DialogDescription>
              {friendName
                ? `${friendName} will no longer see your friends-only profile content. You can send a new request later.`
                : "They'll no longer see your friends-only profile content. You can send a new request later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => removeFriend({ friendshipId }))}
            >
              {pending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
