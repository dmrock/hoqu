"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);
  const sent = state !== null && "sent" in state;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-pixel text-base tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          {sent ? "Check your inbox" : "We'll email you a reset link"}
        </p>
      </div>

      {sent ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          If an account exists for that email, we've sent a link to reset your password. The link
          expires in 1 hour.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {state !== null && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-primary hover:text-primary-hover underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
