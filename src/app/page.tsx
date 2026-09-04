import {
  BarChart3,
  BookOpen,
  Clapperboard,
  Gamepad2,
  LayoutGrid,
  Lock,
  Trophy,
  Tv,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PixelBits } from "@/components/icons/pixel-bits";
import { DataAttribution } from "@/components/layout/data-attribution";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typewriter } from "@/components/ui/typewriter";
import { GITHUB_REPO_URL, SITE_URL } from "@/lib/site";

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
        <Logo href="/" size="lg" />
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="relative grid items-center gap-10 py-12 md:min-h-[70svh] md:grid-cols-2 md:gap-12 md:py-16">
        <div
          aria-hidden
          className="pixel-grid pointer-events-none absolute -inset-x-6 inset-y-0 md:-inset-x-12"
        />
        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 font-pixel text-[10px] text-muted-foreground uppercase">
            <PixelBits className="size-2.5" />
            Free · Open source
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.05]">
            <Typewriter text={"Log what you watch,\nplay, and read."} />
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

      <FeatureRow
        eyebrow="02 · Scoring"
        title="Weighted XP for every quest"
        visual={<PointsChips />}
      >
        <p>
          Every movie, TV season, video game, and book you finish pays out experience points scaled
          by effort — beating a 60-hour RPG counts for more than a movie night.
        </p>
        <p>Honor system: we trust our adventurers to log their quests honestly.</p>
      </FeatureRow>

      <section className="py-8 md:py-12">
        <Eyebrow>03 · Everything else</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FeatureCard icon={<Trophy />} tone="accent" title="Achievements worth hunting">
            Unlock pixel badges as your log grows — from your first completed movie to rating ten
            titles to finishing something in all four hobbies. New unlocks pop up as toasts the
            moment you earn them.
          </FeatureCard>
          <FeatureCard icon={<Users />} tone="primary" title="Friends & guilds">
            Add friends and form a guild of up to 50 members with a shareable invite code. Each
            guild links straight to its own Discord server, so the chat lives where your party
            already hangs out.
          </FeatureCard>
          <FeatureCard icon={<BarChart3 />} tone="warning" title="Leaderboards without strangers">
            Friends-only and guild-only leaderboards rank total XP and per-hobby completions. There
            is no global leaderboard — you only ever compete with people you actually know.
          </FeatureCard>
          <FeatureCard icon={<Lock />} tone="foreground" title="Privacy on your terms">
            Decide who can see your profile: everyone, friends only, guildmates only, or just you.
            Your watchlist, game backlog, and reading log stay exactly as private as you want.
          </FeatureCard>
        </div>
      </section>

      <div className="flex justify-center pb-4">
        <Link
          href="/features"
          className="text-sm text-primary transition-colors hover:text-primary-hover"
        >
          See all features →
        </Link>
      </div>

      <Card padding="none" className="relative my-10 overflow-hidden text-center md:my-14">
        <div aria-hidden className="pixel-grid pointer-events-none absolute inset-0" />
        <div className="relative px-6 py-10 md:py-14">
          <Eyebrow className="justify-center">Press start</Eyebrow>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
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
        </div>
      </Card>

      <footer className="flex flex-col items-center gap-2 pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>© {new Date().getFullYear()} HOQU</span>
          <span aria-hidden>·</span>
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <span aria-hidden>·</span>
          <Link href="/support" className="transition-colors hover:text-foreground">
            Support
          </Link>
          <span aria-hidden>·</span>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-foreground"
          >
            Source
          </a>
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

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={
        className
          ? `flex items-center gap-2 font-pixel text-[10px] text-primary uppercase ${className}`
          : "flex items-center gap-2 font-pixel text-[10px] text-primary uppercase"
      }
    >
      <PixelBits className="size-2.5" />
      {children}
    </p>
  );
}

function HowItWorks() {
  return (
    <section className="py-10 md:py-14">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>01 · How it works</Eyebrow>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          One tracker instead of four
        </h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          A movie tracker, TV show tracker, game backlog, and reading log sharing a single XP bar.
        </p>
      </div>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        <Step n="01" title="Search & add">
          Find any movie, TV show, video game, or book with built-in search powered by TMDB, IGDB,
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
    <Card asChild padding="lg">
      <li>
        <span className="font-pixel text-xs text-primary">{n}</span>
        <h3 className="mt-3 text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </li>
    </Card>
  );
}

function FeatureRow({
  eyebrow,
  title,
  visual,
  children,
}: {
  eyebrow: string;
  title: string;
  visual: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:gap-12 md:py-12">
      <div className="space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
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
  tone,
  title,
  children,
}: {
  icon: React.ReactNode;
  tone: "primary" | "accent" | "warning" | "foreground";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="interactive" padding="lg" className="hover:-translate-y-0.5">
      <IconTile tone={tone} size="lg">
        {icon}
      </IconTile>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </Card>
  );
}

const POINT_CHIPS = [
  { label: "Movies", points: "+1 XP", icon: <Clapperboard />, tone: "primary" as const },
  { label: "TV shows", points: "+5 XP / season", icon: <Tv />, tone: "accent" as const },
  { label: "Games", points: "+10 XP", icon: <Gamepad2 />, tone: "warning" as const },
  { label: "Books", points: "+6 XP", icon: <BookOpen />, tone: "foreground" as const },
];

function PointsChips() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
      {POINT_CHIPS.map((chip) => (
        <Card key={chip.label} className="flex items-center gap-3">
          <IconTile tone={chip.tone}>{chip.icon}</IconTile>
          <div className="min-w-0">
            <div className="font-pixel text-[11px] text-foreground">{chip.points}</div>
            <div className="mt-1 text-xs text-muted-foreground">{chip.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function FeatureGrid() {
  return (
    <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
      <FeatureTile
        icon={<LayoutGrid />}
        tone="foreground"
        title="4 hobbies"
        description="Movies, TV, games, books"
      />
      <FeatureTile
        icon={<Trophy />}
        tone="accent"
        title="XP & achievements"
        description="Points for every quest, badges to unlock"
      />
      <FeatureTile
        icon={<Users />}
        tone="primary"
        title="Friends & guilds"
        description="Add friends, form parties of up to 50"
      />
      <FeatureTile
        icon={<BarChart3 />}
        tone="warning"
        title="Leaderboards"
        description="Compare progress with friends and guildmates"
      />
    </div>
  );
}

function FeatureTile({
  icon,
  tone,
  title,
  description,
}: {
  icon: React.ReactNode;
  tone: "primary" | "accent" | "warning" | "foreground";
  title: string;
  description: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <IconTile tone={tone} size="lg">
        {icon}
      </IconTile>
      <div>
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
