"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type VerifyEmailState, verifyEmailAction } from "@/app/(auth)/actions";
import { AuthHeading } from "@/components/auth/auth-heading";
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
        <AuthHeading
          eyebrow="Saved"
          title="Email verified"
          description="Thanks — your email is confirmed. Enjoy your quests!"
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
        title="Verify your email"
        description="Confirm that this address belongs to you to finish setting up your HOQU account."
      />

      {result && !result.ok ? <p className="text-sm text-destructive">{result.error}</p> : null}

      <Button onClick={handleVerify} disabled={submitting} className="w-full">
        {submitting ? "Verifying…" : "Verify email"}
      </Button>
    </div>
  );
}
