"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { leaveGuild } from "@/app/(main)/guilds/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LeaveGuildButton({
  guildId,
  guildName,
  isMaster,
}: {
  guildId: string;
  guildName: string;
  isMaster: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLeave() {
    setError(null);
    startTransition(async () => {
      const res = await leaveGuild({ guildId });
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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LogOut />
        Leave guild
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leave {guildName}?</DialogTitle>
            <DialogDescription>
              {isMaster
                ? "You're the only master. Leaving will delete the guild for everyone."
                : "You can rejoin later if someone shares the invite code."}
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={pending}>
              {pending ? "Leaving..." : isMaster ? "Delete guild" : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
