import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";
import { generateToken, hashToken } from "./tokens-crypto";

type TokenPurpose = (typeof authTokens.purpose.enumValues)[number];

type IssueTokenInput = {
  userId: string;
  purpose: TokenPurpose;
  ttlMinutes: number;
  /** Required for email_change: the address to switch to once confirmed. */
  newEmail?: string;
};

/**
 * Issue a single-use token, returning the raw value for the emailed link. Any
 * prior token of the same purpose for this user is dropped first so an old link
 * stops working once a newer one is requested.
 */
export async function issueToken({
  userId,
  purpose,
  ttlMinutes,
  newEmail,
}: IssueTokenInput): Promise<string> {
  const raw = generateToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  await db.batch([
    db
      .delete(authTokens)
      .where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose))),
    db.insert(authTokens).values({
      userId,
      purpose,
      tokenHash: hashToken(raw),
      newEmail: newEmail ?? null,
      expiresAt,
    }),
  ]);

  return raw;
}

type ConsumedToken = { userId: string; newEmail: string | null };

/**
 * Validate and burn a token in one step. The DELETE … RETURNING is atomic, so a
 * token can only be consumed once even under concurrent clicks; expiry is checked
 * after the row is already gone (an expired token is spent regardless).
 */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose,
): Promise<ConsumedToken | null> {
  const [row] = await db
    .delete(authTokens)
    .where(and(eq(authTokens.tokenHash, hashToken(raw)), eq(authTokens.purpose, purpose)))
    .returning({
      userId: authTokens.userId,
      newEmail: authTokens.newEmail,
      expiresAt: authTokens.expiresAt,
    });

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return { userId: row.userId, newEmail: row.newEmail };
}
