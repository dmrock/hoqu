import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
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

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/login");

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

  const userProps = {
    email: session.user.email,
    name: profile?.name ?? session.user.name ?? null,
    image: profile?.image ?? session.user.image ?? null,
    username: profile?.username ?? null,
  };

  return (
    <MotionProvider>
      <div className="flex min-h-svh">
        <Sidebar {...userProps} pendingRequests={pendingRequests} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header {...userProps} pendingRequests={pendingRequests} />
          {profile && !profile.emailVerified ? <VerifyEmailBanner email={userProps.email} /> : null}
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
