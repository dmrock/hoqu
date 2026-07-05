"use client";

import { X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { resendVerificationEmailAction } from "@/app/(main)/settings/actions";

const DISMISS_KEY = "hoqu-verify-email-dismissed";

export function VerifyEmailBanner({ email }: { email: string }) {
  // sessionStorage doesn't exist during SSR, so start hidden and reveal after
  // mount — the reverse (start visible) would flash for users who dismissed it.
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, startTransition] = useTransition();

  useEffect(() => {
    if (!sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  function resend() {
    setMessage(null);
    setFailed(false);
    startTransition(async () => {
      const res = await resendVerificationEmailAction();
      if (res.ok) {
        setMessage(`Sent! Check ${email} for the link.`);
      } else {
        setMessage(res.error);
        setFailed(true);
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
        <p className="flex-1">
          {message ?? (
            <>
              Verify your email — we sent a link to <span className="font-mono">{email}</span>.
              Didn&apos;t get it?
            </>
          )}{" "}
          {failed || !message ? (
            <button
              type="button"
              onClick={resend}
              disabled={sending}
              className="font-semibold underline underline-offset-2 hover:text-warning/80 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Resend verification email"}
            </button>
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 hover:bg-warning/20"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
