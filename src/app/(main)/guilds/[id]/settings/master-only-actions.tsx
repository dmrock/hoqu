"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteGuild, rotateInviteCode } from "@/app/(main)/guilds/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RotateInviteCodeButton({
  guildId,
  currentCode,
}: {
  guildId: string;
  currentCode: string;
}) {
  const [code, setCode] = useState(currentCode);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await rotateInviteCode({ guildId });
      if (res.ok && res.data) setCode(res.data.inviteCode);
      else if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-lg tracking-wider">{code}</p>
      <Button variant="outline" size="sm" disabled={pending} onClick={handleClick}>
        <RefreshCw />
        {pending ? "Rotating..." : "Rotate code"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Anyone with the old code won't be able to join after you rotate.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function DeleteGuildButton({ guildId, guildName }: { guildId: string; guildName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteGuild({ guildId });
      if (res.ok) {
        setOpen(false);
        router.push("/guilds");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 />
        Delete guild
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {guildName}?</DialogTitle>
            <DialogDescription>
              This removes the guild for everyone and can't be undone. Type the guild name to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="confirm-name">Confirm guild name</Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirmText !== guildName}
              onClick={handleDelete}
            >
              {pending ? "Deleting..." : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
