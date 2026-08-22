import { Bug, Lightbulb, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { GithubIcon } from "@/components/icons/github-icon";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import {
  CONTACT_EMAIL,
  GITHUB_ISSUES_URL,
  GITHUB_NEW_BUG_URL,
  GITHUB_NEW_FEATURE_URL,
  GITHUB_NEW_QUESTION_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Ask a question, report a bug, or request a feature for HOQU. Everything is tracked in public on GitHub; email covers anything private.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <PublicShell>
      <article className="mx-auto w-full max-w-2xl py-8 md:py-12">
        <h1 className="font-pixel text-xl leading-relaxed text-foreground md:text-2xl">Support</h1>
        <p className="mt-4 text-base text-muted-foreground">
          Questions, bugs, and feature requests all go to the same place: the issue tracker on
          GitHub. It&apos;s public, so an answer written once is there for whoever hits the same
          thing next — and you can watch a bug move from reported to fixed.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-center">
          <GithubIcon className="mx-auto size-8 text-foreground" />
          <h2 className="mt-4 font-pixel text-sm leading-relaxed text-foreground">dmrock/hoqu</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            The whole app is open source. Browse the code, or open an issue — a free GitHub account
            is all it takes.
          </p>
          <Button asChild size="lg" className="mt-6">
            <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer noopener">
              <GithubIcon className="size-4" />
              Open the issue tracker
            </a>
          </Button>
        </div>

        <h2 className="mt-12 font-pixel text-sm leading-relaxed text-accent">Pick a lane</h2>
        <div className="mt-6 space-y-4">
          <Lane
            icon={<Bug className="size-5 text-destructive" />}
            title="Report a bug"
            href={GITHUB_NEW_BUG_URL}
            cta="File a bug report"
          >
            Say what you did, what you expected, and what happened instead. If the app showed you an
            error screen, the &quot;Report it&quot; button there carries the error code across for
            you — that code is what ties your report to the server log.
          </Lane>
          <Lane
            icon={<Lightbulb className="size-5 text-accent" />}
            title="Request a feature"
            href={GITHUB_NEW_FEATURE_URL}
            cta="Open a feature request"
          >
            One idea per issue, with the problem it solves rather than the solution you have in
            mind. HOQU is a hobby project, so the honest answer is often &quot;not soon&quot; — but
            requests do shape what gets built next.
          </Lane>
          <Lane
            icon={<MessageCircleQuestion className="size-5 text-primary" />}
            title="Ask a question"
            href={GITHUB_NEW_QUESTION_URL}
            cta="Ask a question"
          >
            Why a show split into seasons, how XP is weighted, what a locked achievement wants, why
            a search came up empty. Search the closed issues first — the answer may already be
            sitting there.
          </Lane>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <div className="flex size-12 items-center justify-center rounded-lg bg-background">
            <ShieldCheck className="size-6 text-foreground" />
          </div>
          <h2 className="mt-4 font-pixel text-xs leading-relaxed text-accent">
            Private, or no GitHub account?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            instead. Account trouble, a privacy request, or anything with your personal details in
            it belongs there rather than in a public tracker. Security issues especially: report
            them privately first and give it a few days before sharing them anywhere else.
          </p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          HOQU is built and maintained by one person, so replies are best-effort rather than
          same-day. Nothing gets lost, though — every issue is read.
        </p>
      </article>
    </PublicShell>
  );
}

function Lane({
  icon,
  title,
  href,
  cta,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
          {icon}
        </div>
        <h3 className="font-pixel text-[11px] leading-snug text-foreground">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <a href={href} target="_blank" rel="noreferrer noopener">
          {cta}
        </a>
      </Button>
    </div>
  );
}
