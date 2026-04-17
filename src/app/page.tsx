import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <header className="space-y-3">
          <h1 className="font-pixel text-2xl text-primary">HOQU</h1>
          <p className="text-muted-foreground">
            Track your hobbies. Earn achievements. Level up with friends.
          </p>
        </header>

        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-pixel text-xs text-accent">SHADCN BUTTONS</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-pixel text-xs text-accent">THEME TOKENS</h2>
          <div className="grid grid-cols-2 gap-3">
            <Swatch name="background" className="bg-background" />
            <Swatch name="surface" className="bg-surface" />
            <Swatch name="surface-hover" className="bg-surface-hover" />
            <Swatch name="border" className="bg-border" />
            <Swatch name="primary" className="bg-primary" />
            <Swatch name="primary-hover" className="bg-primary-hover" />
            <Swatch name="accent" className="bg-accent" />
            <Swatch name="warning" className="bg-warning" />
            <Swatch name="error" className="bg-error" />
            <Swatch name="foreground" className="bg-foreground" />
            <Swatch name="muted-foreground" className="bg-muted-foreground" />
            <Swatch name="guild-gold" className="bg-guild-gold" />
            <Swatch name="officer-silver" className="bg-officer-silver" />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-pixel text-xs text-accent">FONTS</h2>
          <p className="font-pixel text-xs text-foreground">PIXEL — Press Start 2P</p>
          <p className="font-sans text-foreground">Sans — Inter (body text)</p>
          <p className="font-mono text-foreground">Mono — JetBrains Mono 1234567890</p>
        </section>
      </div>
    </main>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded border border-border ${className}`} />
      <span className="font-mono text-xs text-muted-foreground">{name}</span>
    </div>
  );
}
