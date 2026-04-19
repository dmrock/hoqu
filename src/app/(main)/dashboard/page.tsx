import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="font-pixel text-2xl">Welcome, adventurer</h1>
        <p className="text-muted-foreground">Signed in as {session?.user?.email ?? "unknown"}</p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}
