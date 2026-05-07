"use client";

import { useState, useTransition } from "react";
import { updateGuild } from "@/app/(main)/guilds/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditGuildForm({
  guildId,
  initialDescription,
  initialDiscordInviteUrl,
}: {
  guildId: string;
  initialDescription: string;
  initialDiscordInviteUrl: string;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [discord, setDiscord] = useState(initialDiscordInviteUrl);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const dirty = description !== initialDescription || discord !== initialDiscordInviteUrl;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await updateGuild({
        guildId,
        description: description.trim() || undefined,
        discordInviteUrl: discord.trim() || undefined,
      });
      if (res.ok) setFeedback({ kind: "ok", text: "Saved." });
      else setFeedback({ kind: "error", text: res.error });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={3}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="discord">Discord invite URL</Label>
        <Input
          id="discord"
          value={discord}
          onChange={(e) => setDiscord(e.target.value)}
          maxLength={200}
          placeholder="https://discord.gg/..."
        />
      </div>
      {feedback ? (
        <p className={feedback.kind === "ok" ? "text-xs text-accent" : "text-xs text-destructive"}>
          {feedback.text}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
