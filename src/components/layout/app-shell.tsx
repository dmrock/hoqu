import "server-only";

import { eq } from "drizzle-orm";
import { UnlockToaster } from "@/components/achievements/unlock-toaster";
import { DataAttribution } from "@/components/layout/data-attribution";
import { Header } from "@/components/layout/header";
import { MotionProvider } from "@/components/layout/motion-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { VerifyEmailBanner } from "@/components/layout/verify-email-banner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { countIncomingRequests } from "@/lib/friendships";

export type ShellData = {
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
  emailVerified: boolean;
  pendingRequests: number;
};

/**
 * Loads everything the signed-in chrome renders, or null when there's no
 * session. **Call this from the layout (or page) itself, never from inside
 * `AppShell`.** A layout that awaits nothing is a static segment, and Next then
 * skips re-rendering it when a server action calls `revalidatePath("/friends")`
 * — which leaves the sidebar's pending-request badge stale until a hard reload.
 * e2e/specs/friends.spec.ts covers exactly that.
 */
export async function loadShellData(): Promise<ShellData | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  // Read live profile fields from the DB rather than relying on the JWT,
  // which only refreshes on sign-in. This keeps the avatar dropdown's Profile
  // link in sync if the username (or display name / image) changes.
  const [[profile], pendingRequests] = await Promise.all([
    db
      .select({
        name: users.name,
        image: users.image,
        username: users.username,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
    countIncomingRequests(session.user.id),
  ]);

  return {
    email: session.user.email,
    name: profile?.name ?? session.user.name ?? null,
    image: profile?.image ?? session.user.image ?? null,
    username: profile?.username ?? null,
    emailVerified: Boolean(profile?.emailVerified),
    pendingRequests,
  };
}

/**
 * The signed-in chrome. Presentational on purpose — see `loadShellData`. Lives
 * here rather than inline in `(main)/layout.tsx` because `/support` renders it
 * too: that page sits outside the route group (signed-out visitors need it) but
 * still needs the sidebar when the reader is signed in.
 */
export function AppShell({ data, children }: { data: ShellData; children: React.ReactNode }) {
  const { emailVerified, pendingRequests, ...userProps } = data;

  return (
    <MotionProvider>
      <div className="flex min-h-svh">
        <Sidebar {...userProps} pendingRequests={pendingRequests} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header {...userProps} pendingRequests={pendingRequests} />
          {emailVerified ? null : <VerifyEmailBanner email={userProps.email} />}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">{children}</main>
          <footer className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-6">
            <DataAttribution />
          </footer>
        </div>
        <UnlockToaster />
      </div>
    </MotionProvider>
  );
}
