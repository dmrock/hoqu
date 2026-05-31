import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "HOQU — Log what you watch, play, and read.",
  description:
    "HOQU turns your hobbies into a game. Earn XP for every movie, show, game, and book you finish. Unlock achievements, join guilds, and climb leaderboards with friends.",
};

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 md:px-12 md:py-8">
      <header className="flex items-center justify-between">
        <span className="font-pixel text-base text-primary md:text-lg">HOQU</span>
        <Link
          href="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-10 py-6 md:grid-cols-2 md:gap-12 md:py-10">
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

      <footer className="flex items-center justify-center gap-3 pt-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="transition-colors hover:text-foreground">
          Terms
        </Link>
      </footer>
    </main>
  );
}

function FeatureGrid() {
  return (
    <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
      <FeatureTile
        sprite={<HobbiesSprite />}
        title="4 hobbies"
        description="Movies, TV, games, books"
      />
      <FeatureTile
        sprite={<XpSprite />}
        title="XP & achievements"
        description="Points for every quest, badges to unlock"
      />
      <FeatureTile
        sprite={<FriendsSprite />}
        title="Friends & guilds"
        description="Add friends, form parties of up to 50"
      />
      <FeatureTile
        sprite={<BarsSprite />}
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

const spriteClass = "size-7";

function HobbiesSprite() {
  return (
    <svg
      viewBox="0 0 12 12"
      className={spriteClass}
      shapeRendering="crispEdges"
      aria-hidden
      role="presentation"
    >
      <rect x="0" y="0" width="5" height="5" className="fill-primary" />
      <rect x="7" y="0" width="5" height="5" className="fill-accent" />
      <rect x="0" y="7" width="5" height="5" className="fill-warning" />
      <rect x="7" y="7" width="5" height="5" className="fill-foreground" />
    </svg>
  );
}

function XpSprite() {
  return (
    <PixelArt
      className={cn(spriteClass, "fill-accent")}
      width={12}
      rows={[
        "############",
        "#..........#",
        "#.########.#",
        "#.#......#.#",
        "#.#......#.#",
        ".#.######.#.",
        "..########..",
        "....####....",
        "...######...",
        "..########..",
        ".##########.",
      ]}
    />
  );
}

function FriendsSprite() {
  return (
    <PixelArt
      className={cn(spriteClass, "fill-primary")}
      width={12}
      rows={[
        "..##....##..",
        ".####..####.",
        ".####..####.",
        "..##....##..",
        "............",
        ".####..####.",
        "############",
        "############",
        "############",
      ]}
    />
  );
}

function BarsSprite() {
  return (
    <PixelArt
      className={cn(spriteClass, "fill-warning")}
      width={12}
      rows={[
        ".........###",
        ".........###",
        ".........###",
        ".....###.###",
        ".....###.###",
        ".....###.###",
        ".###.###.###",
        ".###.###.###",
        ".###.###.###",
        "############",
      ]}
    />
  );
}

type PixelArtProps = {
  rows: string[];
  width: number;
  className?: string;
};

function PixelArt({ rows, width, className }: PixelArtProps) {
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let runStart: number | null = null;
    for (let x = 0; x <= row.length; x++) {
      const filled = x < row.length && row[x] === "#";
      if (filled && runStart === null) {
        runStart = x;
      } else if (!filled && runStart !== null) {
        rects.push(
          <rect key={`r${y}c${runStart}`} x={runStart} y={y} width={x - runStart} height={1} />,
        );
        runStart = null;
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
      role="presentation"
    >
      <title>pixel icon</title>
      {rects}
    </svg>
  );
}
