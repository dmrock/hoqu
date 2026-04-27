"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UpdateProfileResult, updateProfile } from "./actions";

export function EditProfileForm({
  initialName,
  initialUsername,
}: {
  initialName: string;
  initialUsername: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [submitting, startTransition] = useTransition();
  const [result, setResult] = useState<UpdateProfileResult | null>(null);

  const dirty = name !== initialName || username !== initialUsername;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateProfile({ name, username });
      setResult(res);
      if (res.ok && res.username !== initialUsername) {
        router.replace(`/profile/${res.username}`);
      }
    });
  }

  const fieldError = (field: "name" | "username") =>
    result && !result.ok && result.field === field ? result.error : null;
  const generalError = result && !result.ok && !result.field ? result.error : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {generalError ? <p className="text-sm text-destructive">{generalError}</p> : null}
      {result?.ok ? <p className="text-sm text-accent">Saved.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
