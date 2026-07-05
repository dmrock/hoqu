import {
  Command,
  Download,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Medal,
  Star,
  TrendingUp,
  Trophy,
  Tv,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Every HOQU feature: track movies, TV, games, and books with statuses, ratings and notes, earn weighted XP, unlock achievements, and climb guild leaderboards.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <PublicShell>
      <article className="mx-auto w-full max-w-2xl py-8 md:py-12">
        <h1 className="font-pixel text-xl leading-relaxed text-foreground md:text-2xl">
          Everything HOQU can do
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          HOQU is one gamified hobby tracker for the four things you spend your free time on —
          movies, TV shows, video games, and books. Instead of juggling a separate movie tracker, TV
          show tracker, game backlog, and reading log, you keep everything in a single collection
          that earns XP, unlocks achievements, and ranks you against your friends and guild.
        </p>

        <div className="mt-10 space-y-10">
          <Section
            sprite={<LayoutGrid className="size-5 text-primary" />}
            title="Track four hobbies in one place"
          >
            <p>
              Add anything with built-in search: movies and TV shows come from TMDB, video games
              from RAWG, and books from Open Library — no copy-pasting titles. Every item you add
              carries its own details:
            </p>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">A status for where you are</strong>
                {" — "}
                Planned, In progress, Completed, or Dropped. Build a watchlist, mark what
                you&apos;re in the middle of, and tick things off as you finish.
              </li>
              <li>
                <strong className="text-foreground">Your own rating</strong>
                {" — "}
                score anything from 1 to 10.
              </li>
              <li>
                <strong className="text-foreground">A note</strong>
                {" — "}
                jot a quick thought or reminder on any title.
              </li>
              <li>
                <strong className="text-foreground">An &ldquo;Again?&rdquo; flag</strong>
                {" — "}
                mark the movies, games, and books you&apos;d happily rewatch, replay, or reread.
              </li>
            </ul>
          </Section>

          <Section
            sprite={<Star className="size-5 text-warning" />}
            title="Your rating and the world's"
          >
            <p>
              Next to your own score, each title shows its external rating so you always have a
              second opinion: the TMDB score for movies and TV shows, and the Metacritic score for
              games. It&apos;s an easy way to decide what to play or watch next from your own
              backlog.
            </p>
          </Section>

          <Section sprite={<Tv className="size-5 text-accent" />} title="TV, season by season">
            <p>
              Multi-season shows aren&apos;t crammed into one row. A show expands into its
              individual seasons, each with its own status and rating, and HOQU rolls them up into a
              clean &ldquo;3/5 done&rdquo; summary. When a new season airs, one tap refreshes the
              show and pulls it in.
            </p>
          </Section>

          <Section
            sprite={<Zap className="size-5 text-warning" />}
            title="Weighted XP for every quest"
          >
            <p>
              Finishing something pays out experience points scaled by effort, so a 60-hour RPG is
              worth more than a movie night. Your points are banked the moment an item is completed
              and survive any future rebalancing of the rates.
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <PointsRow hobby="Movies" xp="+1 XP each" />
                  <PointsRow hobby="TV shows" xp="+5 XP per season" />
                  <PointsRow hobby="Games" xp="+10 XP each" />
                  <PointsRow hobby="Books" xp="+6 XP each" />
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              There&apos;s no tracking or verification — we trust our adventurers to log their
              quests honestly.
            </p>
          </Section>

          <Section
            sprite={<Trophy className="size-5 text-accent" />}
            title="Achievements worth hunting"
          >
            <p>
              Pixel badges unlock as your collection grows, spanning every hobby plus social
              milestones — completing your first title, rating ten items, logging something in all
              four hobbies, and more. The instant you earn one, it pops up as a toast; the full set,
              locked and unlocked, lives on your achievements page.
            </p>
          </Section>

          <Section
            sprite={<LayoutDashboard className="size-5 text-primary" />}
            title="A dashboard that keeps score"
          >
            <p>
              Your dashboard shows total XP, items completed, items rated, and achievements at a
              glance, plus a per-hobby breakdown and your most recent unlocks. A New Releases strip
              surfaces what&apos;s now in theaters, newly aired, and just launched — and flags
              anything already in your list.
            </p>
          </Section>

          <Section
            sprite={<TrendingUp className="size-5 text-accent" />}
            title="See what your circle is into"
          >
            <p>
              A trending feed highlights the top movies, shows, games, and books your{" "}
              <strong className="text-foreground">friends</strong> and{" "}
              <strong className="text-foreground">guildmates</strong>
              {" have been into over the last month, "}
              ranked by their combined rating and how many people picked it up. It&apos;s
              recommendations from the people you actually know — there&apos;s no global feed of
              strangers.
            </p>
          </Section>

          <Section sprite={<Users className="size-5 text-primary" />} title="Friends & guilds">
            <p>
              Send and accept friend requests to build your circle, then form a guild of up to 50
              members with a shareable invite code you can rotate at any time. Guilds carry roles —
              master, officer, and member — and link straight to their own Discord server, so the
              conversation lives where your party already hangs out.
            </p>
          </Section>

          <Section
            sprite={<Medal className="size-5 text-warning" />}
            title="Leaderboards without strangers"
          >
            <p>
              Friends-only and guild-only leaderboards rank everyone by total XP and per-hobby
              completions. There is deliberately no global leaderboard — you only ever measure up
              against people you&apos;ve chosen to connect with.
            </p>
          </Section>

          <Section
            sprite={<Lock className="size-5 text-foreground" />}
            title="Privacy on your terms"
          >
            <p>
              You decide who can see your profile with four visibility levels: public, friends only,
              guildmates only, or completely private. Your watchlist, game backlog, and reading log
              stay exactly as visible as you want them.
            </p>
          </Section>

          <Section
            sprite={<Download className="size-5 text-primary" />}
            title="Your data stays yours"
          >
            <p>
              Everything you log is yours to take. Download your full collection — every item, your
              stats, and your achievements — as JSON, or your items as a flat CSV, anytime from
              Settings. No lock-in, no support ticket.
            </p>
          </Section>

          <Section
            sprite={<Command className="size-5 text-accent" />}
            title="Quick to use, easy to join"
          >
            <p>
              A{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-xs">
                Cmd/Ctrl + K
              </kbd>{" "}
              command palette jumps you to anything in your collection from anywhere in the app.
              Sign up in seconds with an email and password or your Google account.
            </p>
          </Section>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <h2 className="font-pixel text-base leading-relaxed md:text-lg">Start your collection</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            Free to play. Log your first movie, show, game, or book in under a minute.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </article>
    </PublicShell>
  );
}

function Section({
  sprite,
  title,
  children,
}: {
  sprite: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
          {sprite}
        </span>
        <h2 className="font-pixel text-sm leading-relaxed text-accent">{title}</h2>
      </div>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PointsRow({ hobby, xp }: { hobby: string; xp: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-foreground">{hobby}</td>
      <td className="px-4 py-2.5 text-right font-mono text-accent">{xp}</td>
    </tr>
  );
}
