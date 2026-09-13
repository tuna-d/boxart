import Link from "next/link";

export default function Home() {
  return (
    <main className="px-6 py-20 md:px-10 md:py-28">
      <div className="flex max-w-3xl flex-col gap-6">
        <span className="font-pixel text-sm text-p2">&gt; Press start</span>
        <h1 className="font-pixel text-4xl leading-tight font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-6xl">
          Keep score of every game you play
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-ink-soft">
          Log what you played, rate it with hearts and post your review to the high-score table.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <Link
            href="/sign-up"
            className="flex h-13 items-center bg-p1 px-6 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Insert coin
          </Link>
          <Link href="/games" className="text-sm font-semibold text-ink-soft hover:text-accent">
            [ Browse games ]
          </Link>
        </div>
      </div>
    </main>
  );
}
