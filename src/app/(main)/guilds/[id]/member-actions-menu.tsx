"use client";

import { ArrowDown, ArrowUp, Crown, MoreVertical, UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import {
  demoteMember,
  kickMember,
  promoteMember,
  transferOwnership,
} from "@/app/(main)/guilds/actions";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GuildRole } from "@/lib/guilds";

type Action = "promote" | "demote" | "kick" | "transfer";

const COPY: Record<Action, { title: string; description: (name: string) => string; cta: string }> =
  {
    promote: {
      title: "Promote to officer?",
      description: (n) => `${n} will be able to kick members and edit the guild description.`,
      cta: "Promote",
    },
    demote: {
      title: "Demote to member?",
      description: (n) => `${n} will lose officer privileges.`,
      cta: "Demote",
    },
    kick: {
      title: "Kick member?",
      description: (n) => `${n} will be removed from the guild. They can be re-invited later.`,
      cta: "Kick",
    },
    transfer: {
      title: "Transfer ownership?",
      description: (n) =>
        `${n} becomes the new master. You'll be demoted to officer and can no longer delete the guild.`,
      cta: "Transfer",
    },
  };

type Props = {
  guildId: string;
  memberUserId: string;
  memberName: string;
  memberRole: GuildRole;
  viewerRole: GuildRole;
};

export function MemberActionsMenu({
  guildId,
  memberUserId,
  memberName,
  memberRole,
  viewerRole,
}: Props) {
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Master sees: promote (member -> officer), demote (officer -> member),
  //              transfer (any non-master), kick (anyone non-master).
  // Officer sees: kick (members only).
  const canPromote = viewerRole === "master" && memberRole === "member";
  const canDemote = viewerRole === "master" && memberRole === "officer";
  const canTransfer = viewerRole === "master" && memberRole !== "master";
  const canKick =
    (viewerRole === "master" && memberRole !== "master") ||
    (viewerRole === "officer" && memberRole === "member");

  if (!canPromote && !canDemote && !canTransfer && !canKick) return null;

  function handleConfirm() {
    if (!confirm) return;
    setError(null);
    const args = { guildId, memberUserId };
    startTransition(async () => {
      let res: { ok: true; data?: unknown } | { ok: false; error: string };
      if (confirm === "promote") res = await promoteMember(args);
      else if (confirm === "demote") res = await demoteMember(args);
      else if (confirm === "transfer") res = await transferOwnership(args);
      else res = await kickMember(args);
      if (res.ok) setConfirm(null);
      else setError(res.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${memberName}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {canPromote ? (
            <DropdownMenuItem onSelect={() => setConfirm("promote")}>
              <ArrowUp />
              Promote to officer
            </DropdownMenuItem>
          ) : null}
          {canDemote ? (
            <DropdownMenuItem onSelect={() => setConfirm("demote")}>
              <ArrowDown />
              Demote to member
            </DropdownMenuItem>
          ) : null}
          {canTransfer ? (
            <DropdownMenuItem onSelect={() => setConfirm("transfer")}>
              <Crown />
              Transfer ownership
            </DropdownMenuItem>
          ) : null}
          {(canPromote || canDemote || canTransfer) && canKick ? <DropdownMenuSeparator /> : null}
          {canKick ? (
            <DropdownMenuItem
              onSelect={() => setConfirm("kick")}
              className="text-destructive focus:text-destructive"
            >
              <UserMinus />
              Kick from guild
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !pending && (o ? null : setConfirm(null))}
      >
        <DialogContent className="max-w-md">
          {confirm ? (
            <>
              <DialogHeader>
                <DialogTitle>{COPY[confirm].title}</DialogTitle>
                <DialogDescription>{COPY[confirm].description(memberName)}</DialogDescription>
              </DialogHeader>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirm(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button
                  variant={confirm === "kick" ? "destructive" : "default"}
                  onClick={handleConfirm}
                  disabled={pending}
                >
                  {pending ? "Working..." : COPY[confirm].cta}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
