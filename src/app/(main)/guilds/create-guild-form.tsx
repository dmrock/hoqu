"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGuild } from "./actions";

export function CreateGuildForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discord, setDiscord] = useState("");
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createGuild({
        name,
        description: description.trim() || undefined,
        discordInviteUrl: discord.trim() || undefined,
      });
      if (res.ok && res.data) {
        router.push(`/guilds/${res.data.guildId}`);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="guild-name">Guild name</Label>
        <Input
          id="guild-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="The Knights of Letterboxd"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="guild-description">Description (optional)</Label>
        <Textarea
          id="guild-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="What's this guild about?"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="guild-discord">Discord invite URL (optional)</Label>
        <Input
          id="guild-discord"
          value={discord}
          onChange={(e) => setDiscord(e.target.value)}
          maxLength={200}
          placeholder="https://discord.gg/..."
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || name.trim().length < 3}>
          <Plus />
          {submitting ? "Creating..." : "Create guild"}
        </Button>
      </div>
    </form>
  );
}
