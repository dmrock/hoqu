import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq, isNull, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/lib/db";
import { accounts, users, verificationTokens } from "@/lib/db/schema";
import { authConfig } from "./config";
import { verifyPassword } from "./password";
import { slugifyEmail, withUniqueUsername } from "./username";

const credentialsSchema = z.object({
  // Lowercased to match registration, which normalizes emails on write.
  email: z.email().transform((s) => s.toLowerCase()),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  events: {
    createUser: async ({ user }) => {
      if (!user.id || !user.email) return;
      const { id, email } = user;
      const displayName = user.name ?? email.split("@")[0] ?? "user";
      await withUniqueUsername(slugifyEmail(email), (username) =>
        db.update(users).set({ username, name: displayName }).where(eq(users.id, id)),
      );
    },
    // Auth.js creates OAuth users with emailVerified null regardless of what the
    // provider profile says, so mirror Google's own verification here. Running on
    // every sign-in (not just createUser) also backfills pre-existing Google
    // accounts the next time they sign in.
    signIn: async ({ user, account, profile }) => {
      if (account?.provider !== "google" || !profile?.email_verified || !user.id) return;
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(and(eq(users.id, user.id), isNull(users.emailVerified)));
    },
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // lower() instead of plain equality so pre-normalization rows still match.
        const [user] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.id = user.id;
        const [dbUser] = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        token.username = dbUser?.username ?? null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
});

export type AuthCheckResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Server-action gate: resolves the current session and returns the user id, or
 * a uniform `{ ok: false; error: "Unauthorized" }` shape that's assignable to
 * every action's failure branch.
 */
export async function requireUserId(): Promise<AuthCheckResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  return { ok: true, userId: session.user.id };
}
