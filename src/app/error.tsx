"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorScreen({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-6 px-6 pt-20 pb-24">
      <span className="font-pixel text-sm text-p1">&gt; Error</span>
      <h1 className="font-pixel text-5xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
        Game over
      </h1>
      <p className="leading-relaxed text-ink-soft">
        Something broke while loading this screen. The game data service might be busy, so give it another go.
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <button
          type="button"
          onClick={() => retry()}
          className="flex h-13 items-center px-6 font-pixel text-lg key-button"
        >
          Continue?
        </button>
        <Link href="/" className="text-sm font-semibold text-ink-soft uppercase hover:text-accent">
          [ Back to start ]
        </Link>
      </div>
    </main>
  );
}
