"use client";

import { useState, useTransition } from "react";
import { type ActionResult, changePasswordAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [submitting, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword: hasPassword ? currentPassword : undefined,
        newPassword,
      });
      setResult(res);
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-pixel text-sm uppercase">
        {hasPassword ? "Password" : "Set a password"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasPassword
          ? "Change the password you use to sign in."
          : "Add a password so you can also sign in with email, not just Google."}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
        {hasPassword ? (
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">At least 8 characters</p>
        </div>

        {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}
        {result?.ok ? <p className="text-sm text-accent">Password updated.</p> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : hasPassword ? "Update password" : "Set password"}
        </Button>
      </form>
    </section>
  );
}
