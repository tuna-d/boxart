import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameCover } from "@/components/game-cover";
import { LogControls } from "@/components/log-controls";
import { ReviewTable } from "@/components/review-table";
import { ScorePanel } from "@/components/score-panel";
import { releaseYear } from "@/lib/format";
import { getCurrentPlayer } from "@/lib/auth";
import { getGameBySlug } from "@/lib/games";
import { getPopularReviews, getRatingStats } from "@/lib/library";

export async function generateMetadata(props: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const game = await getGameBySlug(slug);
  return game ? { title: game.title, description: game.summary } : { title: "Game not found" };
}

export default async function GamePage(props: PageProps<"/games/[slug]">) {
  const { slug } = await props.params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const viewer = await getCurrentPlayer();
  const [stats, reviews] = await Promise.all([
    getRatingStats(game),
    getPopularReviews(game, viewer?.id),
  ]);
  const meta = [game.developers.join(", "), releaseYear(game.releaseDate), game.platforms.join(" ")].filter(
    Boolean,
  );

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="grid gap-10 md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:gap-11">
        <GameCover
          title={game.title}
          imageUrl={game.coverUrl}
          eager
          className="w-full max-w-[220px] md:max-w-[300px]"
        />

        <section className="flex flex-col gap-5">
          <span className="font-pixel text-sm text-p2">&gt; Game selected</span>
          <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-6xl">
            {game.title}
          </h1>
          <p className="text-sm tracking-wide text-ink-soft uppercase">{meta.join(" / ")}</p>
          <p className="max-w-2xl leading-relaxed text-pretty text-ink-soft">{game.summary}</p>

          <LogControls game={{ title: game.title, platforms: game.platforms }} />
        </section>

        <div className="md:col-span-2 xl:col-span-1">
          <ScorePanel stats={stats} />
        </div>
      </div>

      <ReviewTable reviews={reviews} />
    </main>
  );
}
