"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { type UpdateProfileResult, updateProfile } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Visibility = "public" | "friends_only" | "guild_only" | "private";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "public", label: "Public", description: "Anyone can view your profile" },
  {
    value: "friends_only",
    label: "Friends only",
    description: "Only accepted friends see your profile",
  },
  {
    value: "guild_only",
    label: "Guild only",
    description: "Only members of shared guilds see your profile",
  },
  { value: "private", label: "Private", description: "Only you see your profile" },
];

export function EditProfileCard({
  initialName,
  initialUsername,
  initialVisibility,
}: {
  initialName: string;
  initialUsername: string;
  initialVisibility: Visibility;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [submitting, startTransition] = useTransition();
  const [result, setResult] = useState<UpdateProfileResult | null>(null);

  const dirty =
    name !== initialName || username !== initialUsername || visibility !== initialVisibility;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateProfile({ name, username, profileVisibility: visibility });
      setResult(res);
      if (res.ok && res.username !== initialUsername) {
        router.replace(`/profile/${res.username}`);
      }
    });
  }

  const fieldError = (field: "name" | "username" | "profileVisibility") =>
    result && !result.ok && result.field === field ? result.error : null;
  const generalError = result && !result.ok && !result.field ? result.error : null;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-pixel text-sm uppercase">Profile</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        How you appear to other adventurers, and who can see your profile.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              aria-invalid={fieldError("name") ? true : undefined}
            />
            <p className="text-xs text-muted-foreground">
              How other adventurers see you. 1–50 characters.
            </p>
            {fieldError("name") ? (
              <p className="text-xs text-destructive">{fieldError("name")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              aria-invalid={fieldError("username") ? true : undefined}
            />
            <p className="text-xs text-muted-foreground">
              3–20 lowercase letters, numbers, or dashes. Used in your profile URL.
            </p>
            {fieldError("username") ? (
              <p className="text-xs text-destructive">{fieldError("username")}</p>
            ) : null}
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Profile visibility</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = visibility === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
                  )}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={active}
                    onChange={() => setVisibility(opt.value)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {fieldError("profileVisibility") ? (
            <p className="text-xs text-destructive">{fieldError("profileVisibility")}</p>
          ) : null}
        </fieldset>

        {generalError ? <p className="text-sm text-destructive">{generalError}</p> : null}
        {result?.ok ? <p className="text-sm text-accent">Saved.</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={!dirty || submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
