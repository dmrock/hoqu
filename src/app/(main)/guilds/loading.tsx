import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function GuildsLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Guilds"
        description="Parties of up to 50, each with its own leaderboard and Discord."
      />

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Join with an invite code</CardTitle>
          <CardDescription>Eight characters, from whoever runs the guild.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <div className="h-8 flex-1 rounded-lg skeleton" />
          <div className="h-8 w-20 rounded-lg skeleton" />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="h-3 w-28 rounded skeleton" />
        <ul className="space-y-2">
          {[0, 1].map((row) => (
            <Card key={row} asChild padding="sm">
              <li className="flex items-center gap-3">
                <div className="size-10 shrink-0 rounded-lg skeleton" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-40 max-w-full rounded skeleton" />
                  <div className="h-3 w-28 rounded skeleton" />
                </div>
                <div className="h-5 w-16 shrink-0 rounded-md skeleton" />
              </li>
            </Card>
          ))}
        </ul>
      </section>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Create a guild</CardTitle>
          <CardDescription>You become its master and get an invite code to share.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-8 w-full rounded-lg skeleton" />
          <div className="h-20 w-full rounded-lg skeleton" />
          <div className="h-8 w-28 rounded-lg skeleton" />
        </CardContent>
      </Card>
    </div>
  );
}
