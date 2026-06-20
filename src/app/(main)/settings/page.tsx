import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ChangeEmailCard } from "@/components/settings/change-email-card";
import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select({
      email: users.email,
      username: users.username,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  const hasPassword = Boolean(user.passwordHash);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-pixel text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <ChangePasswordCard hasPassword={hasPassword} />
      <ChangeEmailCard currentEmail={user.email} hasPassword={hasPassword} />
      {user.username ? <DeleteAccountCard username={user.username} /> : null}
    </div>
  );
}
