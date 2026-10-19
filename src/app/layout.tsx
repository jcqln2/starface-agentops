import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "../components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "big yellow · starface chat",
  description: "starface customer chat agent behind visible guardrails, plus an ops dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <Avatar size={36} /> big yellow
          </Link>
          <nav className="flex gap-2 text-sm font-semibold">
            <Link href="/" className="rounded-full bg-white/70 px-4 py-1.5 hover:bg-white">chat</Link>
            <Link href="/ops" className="rounded-full bg-ink px-4 py-1.5 text-sun hover:bg-black">big yellow agent dashboard</Link>
          </nav>
        </header>
        {children}
        <footer className="py-6 text-center text-xs opacity-60">
          unofficial portfolio demo by jacqueline robinson · not affiliated with starface
        </footer>
      </body>
    </html>
  );
}
