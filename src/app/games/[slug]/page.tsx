import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToList } from "@/components/add-to-list";
import { FriendsWhoPlayed } from "@/components/friends-who-played";
import { GameCover } from "@/components/game-cover";
import { LogControls } from "@/components/log-controls";
import { ReviewTable } from "@/components/review-table";
import { ScorePanel } from "@/components/score-panel";
import { formatDate, releaseYear } from "@/lib/format";
import { getCurrentPlayer } from "@/lib/auth";
import { getDiaryPlays } from "@/lib/diary";
import { defaultGamePlatform } from "@/lib/platforms";
import { getGameBySlug } from "@/lib/games";
import { getPopularReviews, getRatingStats, getViewerEntry } from "@/lib/library";
import { getListChoices } from "@/lib/lists";
import { getFriendsWhoPlayed } from "@/lib/follows";

export async function generateMetadata(props: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return {
    title: game.title,
    description: game.summary,
    // Share the cover when there is one, otherwise the site image from the root layout is used.
    ...(game.coverUrl && {
      openGraph: { title: game.title, images: [{ url: game.coverUrl, alt: `${game.title} cover` }] },
    }),
  };
}

export default async function GamePage(props: PageProps<"/games/[slug]">) {
  const { slug } = await props.params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const viewer = await getCurrentPlayer();
  const [stats, reviews, entry, listChoices, friendPlays, diaryPlays] = await Promise.all([
    getRatingStats(game),
    getPopularReviews(game, viewer?.id),
    viewer ? getViewerEntry(game, viewer.id) : null,
    viewer ? getListChoices(viewer.id, game.id) : null,
    viewer ? getFriendsWhoPlayed(viewer.id, game.id) : [],
    viewer ? getDiaryPlays(viewer.id, game.id) : null,
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

          <LogControls
            game={{ slug: game.slug, title: game.title, platforms: game.platforms }}
            entry={entry}
            signedIn={viewer !== null}
            diaryCount={diaryPlays?.count ?? 0}
            defaultPlatform={viewer ? defaultGamePlatform(game.platforms, viewer.platforms) : null}
          />
          {diaryPlays && viewer?.username && (
            <p className="text-sm text-ink-soft">
              <span className="font-pixel text-p2">&gt;</span> You played this{" "}
              {diaryPlays.count === 1 ? "once" : <span className="font-pixel text-accent">{diaryPlays.count} times</span>}{" "}
              · {diaryPlays.count === 1 ? "on" : "last on"}{" "}
              <Link
                href={`/players/${encodeURIComponent(viewer.username)}/diary?month=${diaryPlays.lastPlayedOn.slice(0, 7)}`}
                className="text-accent hover:text-ink hover:underline"
              >
                {formatDate(diaryPlays.lastPlayedOn)}
              </Link>
            </p>
          )}
          {listChoices && <AddToList slug={game.slug} lists={listChoices} />}
          <FriendsWhoPlayed plays={friendPlays} gameTitle={game.title} />
        </section>

        <div className="md:col-span-2 xl:col-span-1">
          <ScorePanel stats={stats} />
        </div>
      </div>

      <ReviewTable reviews={reviews} signedIn={viewer !== null} path={`/games/${game.slug}`} />
    </main>
  );
}
