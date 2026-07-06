import "server-only";

import { sendVerificationEmail } from "@/lib/email/send";
import { issueToken } from "./tokens";

// 24h rather than the 1h used by reset/change links: signup verification is
// not time-sensitive and a same-day click should never dead-end.
const EMAIL_VERIFY_TTL_MINUTES = 24 * 60;

/**
 * Issue a fresh email_verify token (superseding any earlier one) and email the
 * verification link. Inherits the email client's fail-soft posture: returns
 * false instead of throwing when sending isn't possible.
 */
export async function sendVerificationLink(
  userId: string,
  email: string,
  origin: string,
): Promise<boolean> {
  const token = await issueToken({
    userId,
    purpose: "email_verify",
    ttlMinutes: EMAIL_VERIFY_TTL_MINUTES,
  });
  return sendVerificationEmail(email, `${origin}/verify-email?token=${token}`);
}
