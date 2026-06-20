"use client";

import { useState, useTransition } from "react";
import { type ActionResult, requestEmailChangeAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmailCard({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string;
  hasPassword: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [submitting, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await requestEmailChangeAction({ currentPassword, newEmail });
      setResult(res);
      if (res.ok) {
        setCurrentPassword("");
        setNewEmail("");
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-pixel text-sm uppercase">Email</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as <span className="font-mono text-foreground">{currentEmail}</span>
      </p>

      {hasPassword ? (
        <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New email</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-current-password">Account password</Label>
            <Input
              id="email-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}
          {result?.ok ? (
            <p className="text-sm text-accent">
              Check your new inbox for a link to confirm the change.
            </p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send confirmation link"}
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Your email is managed by your Google sign-in.
        </p>
      )}
    </section>
  );
}
