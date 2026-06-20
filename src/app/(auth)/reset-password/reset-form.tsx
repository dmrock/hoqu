"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const done = state !== null && "ok" in state;

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="font-pixel text-base tracking-tight">Password updated</h1>
        <p className="text-sm text-muted-foreground">
          Your password has been changed. You can sign in with it now.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-pixel text-base tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Make it at least 8 characters</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {state !== null && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
