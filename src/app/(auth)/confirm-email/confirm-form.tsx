"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type ActionResult, confirmEmailChangeAction } from "@/app/(main)/settings/actions";
import { AuthHeading } from "@/components/auth/auth-heading";
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
        <AuthHeading
          eyebrow="Saved"
          title="Email confirmed"
          description="Your account email has been updated. Use it next time you sign in."
        />
        <Button asChild className="w-full">
          <Link href="/explore">Go to HOQU</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <AuthHeading
        eyebrow="Checkpoint"
        title="Confirm your new email"
        description="Confirm the change to finish updating your HOQU account email."
      />

      {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}

      <Button onClick={handleConfirm} disabled={submitting} className="w-full">
        {submitting ? "Confirming…" : "Confirm email change"}
      </Button>
    </div>
  );
}
