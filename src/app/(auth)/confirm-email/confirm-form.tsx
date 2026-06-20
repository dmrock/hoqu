"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type ActionResult, confirmEmailChangeAction } from "@/app/(main)/settings/actions";
import { Button } from "@/components/ui/button";

export function ConfirmEmailForm({ token }: { token: string }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [submitting, startTransition] = useTransition();

  function handleConfirm() {
    setResult(null);
    startTransition(async () => {
      setResult(await confirmEmailChangeAction(token));
    });
  }

  if (result?.ok) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="font-pixel text-base tracking-tight">Email confirmed</h1>
        <p className="text-sm text-muted-foreground">
          Your account email has been updated. Use it next time you sign in.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard">Go to HOQU</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="font-pixel text-base tracking-tight">Confirm your new email</h1>
        <p className="text-sm text-muted-foreground">
          Confirm the change to finish updating your HOQU account email.
        </p>
      </div>

      {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}

      <Button onClick={handleConfirm} disabled={submitting} className="w-full">
        {submitting ? "Confirming…" : "Confirm email change"}
      </Button>
    </div>
  );
}
