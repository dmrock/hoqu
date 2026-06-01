import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";

export const metadata: Metadata = {
  title: "Terms of Service — HOQU",
  description: "The terms you agree to when using HOQU.",
};

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="mx-auto w-full max-w-2xl py-8 md:py-12">
        <h1 className="font-pixel text-xl text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 17, 2026</p>

        <div className="mt-8 space-y-6 text-foreground">
          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">What HOQU is</h2>
            <p>
              HOQU is a personal hobby tracker that lets you log movies, TV shows, games, and books,
              earn achievements, and compare progress with friends and guildmates. It is a hobby
              project, offered as-is, with no uptime guarantee.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">Accounts</h2>
            <p>
              You can create an account with an email and password or by signing in with Google.
              You're responsible for keeping your credentials safe and for the content you post
              under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">Acceptable use</h2>
            <p>
              Don't use HOQU to harass other users, post illegal content, attempt to access other
              people's accounts, or abuse the service (including by automating logging to inflate
              points or evade rate limits). We trust adventurers to log their quests honestly —
              accounts that clearly farm points may be reset or removed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">Content</h2>
            <p>
              Your items, notes, achievements, and profile are yours. Catalog metadata (titles,
              cover images, ratings) is provided by TMDB, RAWG, and Open Library and remains subject
              to their respective terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">Termination</h2>
            <p>
              You can request account deletion at any time by emailing{" "}
              <a href="mailto:denis.rork@gmail.com" className="text-primary hover:underline">
                denis.rork@gmail.com
              </a>
              . We may suspend or remove accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">No warranty</h2>
            <p>
              HOQU is provided "as is" without warranty of any kind. To the maximum extent permitted
              by law, the maintainer is not liable for any loss arising from your use of the
              service, including but not limited to lost data, lost points, or downtime.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">Changes</h2>
            <p>
              These terms may change as HOQU evolves. Continued use after a change constitutes
              acceptance. The "Last updated" date reflects the most recent revision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-pixel text-sm text-accent">Contact</h2>
            <p>
              Questions about these terms?{" "}
              <a href="mailto:denis.rork@gmail.com" className="text-primary hover:underline">
                denis.rork@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  );
}
