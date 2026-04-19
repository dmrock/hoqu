import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="font-pixel text-2xl">Welcome, adventurer</h1>
      <p className="text-muted-foreground">Signed in as {session?.user?.email}</p>
    </div>
  );
}
