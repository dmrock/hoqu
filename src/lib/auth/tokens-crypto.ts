import { createHash, randomBytes } from "node:crypto";

/**
 * Raw token handed to the user in an emailed link. URL-safe and high-entropy
 * (256 bits) so it can't be guessed or tampered with.
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * SHA-256 hex digest stored in the DB. A plain hash (no salt) is correct here:
 * the token is already 256 bits of randomness, so there is nothing to brute
 * force and lookup must be deterministic to find the row by hash.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
