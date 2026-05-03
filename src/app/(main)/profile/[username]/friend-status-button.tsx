"use client";

import { Check, UserCheck, UserPlus, X } from "lucide-react";
import { useState, useTransition } from "react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/app/(main)/friends/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FriendshipStatus } from "@/lib/friendships";

type Props = {
  status: FriendshipStatus;
  friendshipId: string | null;
  username: string;
  friendName?: string;
};

export function FriendStatusButton({ status, friendshipId, username, friendName }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) setConfirmOpen(false);
    });
  }

  if (status === "none") {
    return (
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run(() => sendFriendRequest({ username }))}
      >
        <UserPlus />
        Add friend
      </Button>
    );
  }

  if (status === "pending_outgoing") {
    if (!friendshipId) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => cancelFriendRequest({ friendshipId }))}
      >
        <X />
        Cancel request
      </Button>
    );
  }

  if (status === "pending_incoming") {
    if (!friendshipId) return null;
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

  // friends
  if (!friendshipId) return null;
  return (
    <>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => setConfirmOpen(true)}>
        <UserCheck />
        Friends
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
