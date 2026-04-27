import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { EditProfileForm } from "./edit-profile-form";

type ProfileVisibility = "public" | "friends_only" | "guild_only" | "private";

const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  public: "Public",
  friends_only: "Friends only",
  guild_only: "Guild only",
  private: "Private",
};

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { username } = await params;

  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      email: users.email,
      profileVisibility: users.profileVisibility,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  if (!profile) notFound();

  const isOwner = profile.id === session.user.id;
  const visibility = profile.profileVisibility as ProfileVisibility;
  // Phase 1: only enforce `private`. friends_only / guild_only relax to public until
  // Phase 2 wires up friendships and guild membership.
  if (visibility === "private" && !isOwner) notFound();

  const initials = (profile.name ?? profile.email).slice(0, 2).toUpperCase();
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <Avatar className="size-16">
          {profile.image ? (
            <AvatarImage src={profile.image} alt={profile.name ?? profile.username ?? "Profile"} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="font-pixel text-2xl">{profile.name ?? profile.username}</h1>
          <p className="font-mono text-sm text-muted-foreground">
            @{profile.username} · joined {joined}
          </p>
        </div>
        {isOwner ? (
          <span className="font-mono text-xs text-muted-foreground uppercase">
            {VISIBILITY_LABEL[visibility]}
          </span>
        ) : null}
      </section>

      {isOwner ? (
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-pixel text-sm text-muted-foreground uppercase">Edit profile</h2>
          <EditProfileForm
            initialName={profile.name ?? ""}
            initialUsername={profile.username ?? ""}
            initialVisibility={visibility}
          />
        </section>
      ) : null}
    </div>
  );
}
