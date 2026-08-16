"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type VerifyEmailState, verifyEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function VerifyEmailForm({ token }: { token: string }) {
  const [result, setResult] = useState<VerifyEmailState | null>(null);
  const [submitting, startTransition] = useTransition();

  function handleVerify() {
    setResult(null);
    startTransition(async () => {
      setResult(await verifyEmailAction(token));
    });
  }

  if (result?.ok) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="font-pixel text-base tracking-tight">Email verified</h1>
        <p className="text-sm text-muted-foreground">
          Thanks — your email is confirmed. Enjoy your quests!
        </p>
        <Button asChild className="w-full">
          <Link href="/explore">Go to HOQU</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="font-pixel text-base tracking-tight">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          Confirm that this address belongs to you to finish setting up your HOQU account.
        </p>
      </div>

      {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}

      <Button onClick={handleVerify} disabled={submitting} className="w-full">
        {submitting ? "Verifying…" : "Verify email"}
      </Button>
    </div>
  );
}
