import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Level not found",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-6 px-6 pt-20 pb-24">
      <span className="font-pixel text-sm text-p2">&gt; Error 404</span>
      <h1 className="font-pixel text-5xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
        Level not found
      </h1>
      <p className="leading-relaxed text-ink-soft">
        This screen does not exist. The link may be broken, or the game, player or list has been removed.
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <Link
          href="/games"
          className="flex h-13 items-center bg-accent px-6 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Browse games
        </Link>
        <Link href="/" className="text-sm font-semibold text-ink-soft uppercase hover:text-accent">
          [ Back to start ]
        </Link>
      </div>
    </main>
  );
}
