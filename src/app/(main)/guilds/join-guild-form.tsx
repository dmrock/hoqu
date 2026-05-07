"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinGuildByCode } from "./actions";

export function JoinGuildForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await joinGuildByCode({ code: trimmed });
      if (res.ok && res.data) {
        router.push(`/guilds/${res.data.guildId}`);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="invite-code">Invite code</Label>
          <Input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={16}
            autoComplete="off"
            placeholder="e.g. P9TQX2VR"
            className="font-mono"
          />
        </div>
        <Button type="submit" disabled={submitting || code.trim().length === 0}>
          <LogIn />
          {submitting ? "Joining..." : "Join"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
