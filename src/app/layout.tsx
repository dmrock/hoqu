import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start-2p",
  display: "swap",
});

const title = "HOQU — Hobby tracker for movies, TV, games & books";

// Meta description (~155 chars to survive Google's snippet truncation) and a
// shorter Open Graph variant (~125) that social previews show without cutting.
const description =
  "HOQU is a gamified hobby tracker for movies, TV, games, and books. Earn XP for what you finish, unlock achievements, and climb leaderboards with friends.";
const ogDescription =
  "A gamified hobby tracker for movies, TV, games & books. Earn XP, unlock achievements, and climb leaderboards with friends.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "HOQU",
  title: {
    default: title,
    template: "%s · HOQU",
  },
  description,
  keywords: [
    "hobby tracker",
    "movie tracker",
    "TV show tracker",
    "game backlog",
    "book tracker",
    "reading log",
    "gamified",
    "achievements",
    "leaderboards",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "HOQU",
    title,
    description: ogDescription,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} ${pressStart2P.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
