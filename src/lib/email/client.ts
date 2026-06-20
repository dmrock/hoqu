import "server-only";

import { Resend } from "resend";

const FROM = "HOQU <noreply@hoqu.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

type SendArgs = { to: string; subject: string; html: string };

/**
 * Send a transactional email. Fails soft: with no RESEND_API_KEY (local dev,
 * blank-env previews, the test suite) it logs and returns false instead of
 * throwing, so callers — and the Vercel build — never break on missing config.
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.warn(`email skipped (no RESEND_API_KEY): "${subject}" → ${to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("email send failed", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("email send threw", err);
    return false;
  }
}
