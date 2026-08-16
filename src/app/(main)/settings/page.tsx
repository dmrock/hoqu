import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ChangeEmailCard } from "@/components/settings/change-email-card";
import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";
import { EditProfileCard } from "@/components/settings/edit-profile-card";
import { ExportDataCard } from "@/components/settings/export-data-card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

type ProfileVisibility = "public" | "friends_only" | "guild_only" | "private";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select({
      email: users.email,
      name: users.name,
      username: users.username,
      passwordHash: users.passwordHash,
      profileVisibility: users.profileVisibility,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect("/login");

  const hasPassword = Boolean(user.passwordHash);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-pixel text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <EditProfileCard
        initialName={user.name ?? ""}
        initialUsername={user.username ?? ""}
        initialVisibility={user.profileVisibility as ProfileVisibility}
      />
      <ChangePasswordCard hasPassword={hasPassword} />
      <ChangeEmailCard currentEmail={user.email} hasPassword={hasPassword} />
      <ExportDataCard />
      {user.username ? <DeleteAccountCard username={user.username} /> : null}
    </div>
  );
}
