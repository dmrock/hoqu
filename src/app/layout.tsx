import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Press_Start_2P, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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

export const metadata: Metadata = {
  title: "HOQU",
  description: "Track your hobbies. Earn achievements. Level up with friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, jetbrainsMono.variable, pressStart2P.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
