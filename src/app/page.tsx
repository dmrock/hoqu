import { BarChart3, LayoutGrid, Lock, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DataAttribution } from "@/components/layout/data-attribution";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";

// Title and description come from the root layout defaults; the landing is the site root.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HOQU",
  url: SITE_URL,
  description:
    "Gamified hobby tracker for movies, TV shows, video games, and books. Earn weighted XP, unlock achievements, and climb friends-only and guild leaderboards.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 md:px-12 md:py-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from a local literal
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="flex items-center justify-between">
        <span className="font-pixel text-base text-primary md:text-lg">HOQU</span>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="grid items-center gap-10 py-10 md:min-h-[70svh] md:grid-cols-2 md:gap-12 md:py-12">
        <div className="space-y-6">
          <h1 className="font-pixel text-2xl leading-normal sm:text-3xl md:text-[2.5rem] md:leading-[1.4]">
            Log what you watch,
            <br />
            play, and read.
          </h1>
          <p className="max-w-md text-base text-muted-foreground md:text-lg">
            HOQU turns your hobbies into a game. Earn XP for everything you finish, unlock
            achievements, and climb leaderboards with your friends and guild.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        <FeatureGrid />
      </section>

      <HowItWorks />

      <FeatureRow title="Weighted XP for every quest" visual={<PointsChips />}>
        <p>
          Every movie, TV season, video game, and book you finish pays out experience points scaled
          by effort — beating a 60-hour RPG counts for more than a movie night.
        </p>
        <p>Honor system: we trust our adventurers to log their quests honestly.</p>
      </FeatureRow>

      <section className="grid gap-4 py-8 sm:grid-cols-2 md:py-12">
        <FeatureCard
          icon={<Trophy className="size-6 text-accent" />}
          title="Achievements worth hunting"
        >
          Unlock pixel badges as your log grows — from your first completed movie to rating ten
          titles to finishing something in all four hobbies. New unlocks pop up as toasts the moment
          you earn them.
        </FeatureCard>
        <FeatureCard icon={<Users className="size-6 text-primary" />} title="Friends & guilds">
          Add friends and form a guild of up to 50 members with a shareable invite code. Each guild
          links straight to its own Discord server, so the chat lives where your party already hangs
          out.
        </FeatureCard>
        <FeatureCard
          icon={<BarChart3 className="size-6 text-warning" />}
          title="Leaderboards without strangers"
        >
          Friends-only and guild-only leaderboards rank total XP and per-hobby completions. There is
          no global leaderboard — you only ever compete with people you actually know.
        </FeatureCard>
        <FeatureCard
          icon={<Lock className="size-6 text-foreground" />}
          title="Privacy on your terms"
        >
          Decide who can see your profile: everyone, friends only, guildmates only, or just you.
          Your watchlist, game backlog, and reading log stay exactly as private as you want.
        </FeatureCard>
      </section>

      <div className="flex justify-center pb-4">
        <Link
          href="/features"
          className="text-sm text-primary transition-colors hover:text-primary-hover"
        >
          See all features →
        </Link>
      </div>

      <section className="my-10 rounded-xl border border-border bg-card px-6 py-10 text-center md:my-14 md:py-14">
        <h2 className="font-pixel text-base leading-relaxed md:text-lg">
          Ready to level up your hobbies?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
          Free to play. Sign up with email or Google and log your first quest in under a minute.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild size="lg">
            <Link href="/register">Create your free account</Link>
          </Button>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2 pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>© {new Date().getFullYear()} HOQU</span>
          <span aria-hidden>·</span>
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
        <DataAttribution />
      </footer>
    </main>
  );
}

function HowItWorks() {
  return (
    <section className="py-10 md:py-14">
      <h2 className="text-center font-pixel text-base leading-relaxed md:text-lg">How it works</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground md:text-base">
        One hobby tracker instead of four — a movie tracker, TV show tracker, game backlog, and
        reading log sharing a single XP bar.
      </p>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        <Step n="01" title="Search & add">
          Find any movie, TV show, video game, or book with built-in search powered by TMDB, RAWG,
          and Open Library.
        </Step>
        <Step n="02" title="Log progress">
          Move it from planned to completed, rate it, keep notes, and flag the ones you&apos;d
          happily replay or reread.
        </Step>
        <Step n="03" title="Level up">
          Finished quests pay out XP, unlock achievements, and bump you up your friends and guild
          leaderboards.
        </Step>
      </ol>
    </section>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <span className="font-pixel text-xs text-primary">{n}</span>
      <h3 className="mt-3 font-pixel text-[11px] leading-snug text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </li>
  );
}

function FeatureRow({
  title,
  visual,
  children,
}: {
  title: string;
  visual: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-12 md:py-12">
      <div className="space-y-4">
        <h2 className="font-pixel text-sm leading-relaxed text-accent md:text-base">{title}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          {children}
        </div>
      </div>
      <div className="flex justify-center">{visual}</div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex size-12 items-center justify-center rounded-lg bg-background">
        {icon}
      </div>
      <h3 className="mt-4 font-pixel text-xs leading-relaxed text-accent">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function PointsChips() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
      <PointChip label="Movies" points="+1 XP" />
      <PointChip label="TV shows" points="+5 XP / season" />
      <PointChip label="Games" points="+10 XP" />
      <PointChip label="Books" points="+6 XP" />
    </div>
  );
}

function PointChip({ label, points }: { label: string; points: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="font-mono text-base text-foreground sm:text-lg">{points}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureGrid() {
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
      <FeatureTile
        sprite={<LayoutGrid className="size-6 text-foreground" />}
        title="4 hobbies"
        description="Movies, TV, games, books"
      />
      <FeatureTile
        sprite={<Trophy className="size-6 text-accent" />}
        title="XP & achievements"
        description="Points for every quest, badges to unlock"
      />
      <FeatureTile
        sprite={<Users className="size-6 text-primary" />}
        title="Friends & guilds"
        description="Add friends, form parties of up to 50"
      />
      <FeatureTile
        sprite={<BarChart3 className="size-6 text-warning" />}
        title="Leaderboards"
        description="Compare progress with friends and guildmates"
      />
    </div>
  );
}

function FeatureTile({
  sprite,
  title,
  description,
}: {
  sprite: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex size-12 items-center justify-center rounded-lg bg-background">
        {sprite}
      </div>
      <div>
        <div className="font-pixel text-[10px] leading-snug text-foreground">{title}</div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
