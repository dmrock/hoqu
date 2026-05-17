import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — HOQU",
  description: "How HOQU handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="font-pixel text-xs text-primary hover:underline">
        ← HOQU
      </Link>

      <h1 className="font-pixel mt-6 text-xl text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 17, 2026</p>

      <div className="mt-8 space-y-6 text-foreground">
        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">What we collect</h2>
          <p>
            When you sign up, we store your email address, display name, optional username, and (if
            you sign in with Google) the profile image URL Google provides. As you use HOQU, we
            store the items you log — movies, TV shows, games, and books — along with the status,
            rating, and notes you attach to them.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">How we use it</h2>
          <p>
            We use this data solely to operate HOQU: to sign you in, render your profile and stats,
            award achievements, and show leaderboards to your friends and guildmates. We do not sell
            your data, run advertising, or share it with third parties for marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">Third parties</h2>
          <p>
            HOQU stores data on Neon (PostgreSQL hosting) and Upstash (Redis for rate limiting and
            caching), and is deployed on Vercel. When you search for an item, HOQU queries TMDB,
            RAWG, or Open Library from our server — we do not send your identity to those services.
            If you sign in with Google, Google handles the authentication and shares your basic
            profile (email, name, image) with us per their own policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">Cookies</h2>
          <p>
            HOQU sets a single session cookie used by Auth.js to keep you signed in. No tracking or
            analytics cookies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">Your choices</h2>
          <p>
            You control your profile visibility from your profile settings (public, friends only,
            guild only, or private). To delete your account or request a copy of your data, email{" "}
            <a href="mailto:denis.rork@gmail.com" className="text-primary hover:underline">
              denis.rork@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">Changes</h2>
          <p>
            We may update this policy as HOQU evolves. Material changes will be reflected by the
            "Last updated" date above.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-pixel text-sm text-accent">Contact</h2>
          <p>
            Questions? Reach the maintainer at{" "}
            <a href="mailto:denis.rork@gmail.com" className="text-primary hover:underline">
              denis.rork@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
