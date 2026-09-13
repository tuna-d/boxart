import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCover } from "@/components/game-cover";
import { ReviewTable } from "@/components/review-table";
import { ScorePanel } from "@/components/score-panel";
import { getGameBySlug, getPopularReviews, getRatingStats } from "@/lib/games";

const logStatuses = ["Played", "Playing", "Backlog"];

export async function generateMetadata(props: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const game = await getGameBySlug(slug);
  return game ? { title: game.title, description: game.summary } : { title: "Game not found" };
}

export default async function GamePage(props: PageProps<"/games/[slug]">) {
  const { slug } = await props.params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const [stats, reviews] = await Promise.all([
    getRatingStats(game.id),
    getPopularReviews(game.id),
  ]);
  const meta = [game.developers.join(", "), game.releaseDate.slice(0, 4), game.platforms.join(" ")];

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="grid gap-10 md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:gap-11">
        <GameCover title={game.title} className="w-full max-w-[220px] md:max-w-[300px]" />

        <section className="flex flex-col gap-5">
          <span className="font-pixel text-sm text-p2">&gt; Game selected</span>
          <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-6xl">
            {game.title}
          </h1>
          <p className="text-sm tracking-wide text-ink-soft uppercase">{meta.join(" / ")}</p>
          <p className="max-w-2xl leading-relaxed text-pretty text-ink-soft">{game.summary}</p>

          <div className="mt-3 flex flex-wrap gap-2.5 text-sm font-semibold uppercase">
            {logStatuses.map((status) => (
              <Link
                key={status}
                href="/sign-in"
                className="flex h-11 items-center border-2 border-ink px-3.5 hover:border-accent hover:text-accent"
              >
                [ ] {status}
              </Link>
            ))}
          </div>
          <Link
            href="/sign-in"
            className="flex h-13 w-fit items-center bg-p1 px-5 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Press start to log
          </Link>
        </section>

        <div className="md:col-span-2 xl:col-span-1">
          <ScorePanel stats={stats} />
        </div>
      </div>

      <ReviewTable reviews={reviews} />
    </main>
  );
}
