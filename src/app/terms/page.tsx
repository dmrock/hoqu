import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms you agree to when using HOQU.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="mx-auto w-full max-w-2xl py-8 md:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 17, 2026</p>

        <div className="mt-8 space-y-6 text-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">What HOQU is</h2>
            <p>
              HOQU is a personal hobby tracker that lets you log movies, TV shows, games, and books,
              earn achievements, and compare progress with friends and guildmates. It is a hobby
              project, offered as-is, with no uptime guarantee.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Accounts</h2>
            <p>
              You can create an account with an email and password or by signing in with Google.
              You're responsible for keeping your credentials safe and for the content you post
              under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Acceptable use
            </h2>
            <p>
              Don't use HOQU to harass other users, post illegal content, attempt to access other
              people's accounts, or abuse the service (including by automating logging to inflate
              points or evade rate limits). We trust adventurers to log their quests honestly —
              accounts that clearly farm points may be reset or removed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Content</h2>
            <p>
              Your items, notes, achievements, and profile are yours. Catalog metadata (titles,
              cover images, ratings) is provided by{" "}
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                TMDB
              </a>
              ,{" "}
              <a
                href="https://www.igdb.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                IGDB
              </a>
              , and{" "}
              <a
                href="https://openlibrary.org/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline"
              >
                Open Library
              </a>{" "}
              and remains subject to their respective terms. Game data and images are provided by
              IGDB.
            </p>
            <p>
              This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise
              approved by TMDB.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Termination</h2>
            <p>
              You can delete your account at any time from Settings, or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              if that fails. We may suspend or remove accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">No warranty</h2>
            <p>
              HOQU is provided "as is" without warranty of any kind. To the maximum extent permitted
              by law, the maintainer is not liable for any loss arising from your use of the
              service, including but not limited to lost data, lost points, or downtime.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Changes</h2>
            <p>
              These terms may change as HOQU evolves. Continued use after a change constitutes
              acceptance. The "Last updated" date reflects the most recent revision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Contact</h2>
            <p>
              Questions about these terms?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              . Everything else goes through{" "}
              <Link href="/support" className="text-primary hover:underline">
                support
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  );
}
