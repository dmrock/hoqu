"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendFriendRequest } from "./actions";

export function AddFriendForm() {
  const [username, setUsername] = useState("");
  const [submitting, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const value = username.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await sendFriendRequest({ username: value });
      if (res.ok) {
        setFeedback({ kind: "ok", text: `Request sent to @${value.toLowerCase()}` });
        setUsername("");
      } else {
        setFeedback({ kind: "error", text: res.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor="friend-username" className="text-xs text-muted-foreground">
            Find a friend by username
          </label>
          <Input
            id="friend-username"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={submitting || username.trim().length === 0}>
          <UserPlus />
          {submitting ? "Sending..." : "Send request"}
        </Button>
      </div>
      {feedback ? (
        <p className={feedback.kind === "ok" ? "text-xs text-accent" : "text-xs text-destructive"}>
          {feedback.text}
        </p>
      ) : null}
    </form>
  );
}
