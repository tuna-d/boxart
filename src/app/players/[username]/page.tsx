import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCover } from "@/components/game-cover";
import { HeartRating } from "@/components/heart-rating";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerReviewList } from "@/components/player-review-list";
import { TabLink } from "@/components/tab-link";
import { formatMonthYear } from "@/lib/format";
import { getCurrentPlayer } from "@/lib/auth";
import { countByStatus, getPlayerLibrary, getPlayerReviews } from "@/lib/library";
import { getPlayer } from "@/lib/players";
import type { LibraryStatus } from "@/lib/types";

const shelves: { value: LibraryStatus; label: string }[] = [
  { value: "played", label: "Played" },
  { value: "playing", label: "Playing" },
  { value: "backlog", label: "Backlog" },
];

function isShelf(value: unknown): value is LibraryStatus {
  return shelves.some((shelf) => shelf.value === value);
}

export async function generateMetadata(props: PageProps<"/players/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const player = await getPlayer(username);
  return player ? { title: player.username, description: player.bio } : { title: "Player not found" };
}

export default async function PlayerPage(props: PageProps<"/players/[username]">) {
  const { username } = await props.params;
  const player = await getPlayer(username);
  if (!player) notFound();

  const searchParams = await props.searchParams;
  const shelf = isShelf(searchParams.shelf) ? searchParams.shelf : "played";
  const viewer = await getCurrentPlayer();
  const [library, reviews] = await Promise.all([
    getPlayerLibrary(player.id),
    getPlayerReviews(player, viewer?.id),
  ]);
  const counts = countByStatus(library);
  const shelfItems = library.filter(({ entry }) => entry.status === shelf);
  const profileHref = `/players/${encodeURIComponent(player.username)}`;

  const counters = [
    ...shelves.map((item) => ({ label: item.label, value: counts[item.value] })),
    { label: "Reviews", value: reviews.length },
  ];

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <PlayerAvatar username={player.username} size="lg" />
        <div className="flex min-w-0 flex-col gap-3">
          <span className="font-pixel text-sm text-p2">&gt; Player profile</span>
          <h1 className="font-pixel text-3xl leading-none font-bold break-all uppercase [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
            {player.username}
          </h1>
          <p className="max-w-xl text-ink-soft">{player.bio}</p>
          <span className="text-xs text-muted uppercase">Joined {formatMonthYear(player.joinedAt)}</span>
        </div>
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-y-2 border-y-2 border-dashed border-line py-5 md:grid-cols-4">
        {counters.map((counter) => (
          <div key={counter.label} className="flex flex-col gap-2">
            <dt className="font-pixel text-sm text-muted">{counter.label}</dt>
            <dd className="font-pixel text-4xl text-accent">{counter.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="shelves-heading" className="mt-12">
        <h2 id="shelves-heading" className="sr-only">
          Shelves
        </h2>
        <nav aria-label="Shelves" className="flex flex-wrap gap-2">
          {shelves.map((item) => (
            <TabLink
              key={item.value}
              href={item.value === "played" ? profileHref : `${profileHref}?shelf=${item.value}`}
              active={item.value === shelf}
            >
              {item.label} · {counts[item.value]}
            </TabLink>
          ))}
        </nav>

        {shelfItems.length === 0 ? (
          <p className="mt-8 text-ink-soft">Nothing on this shelf yet.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-3 gap-x-5 gap-y-8 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
            {shelfItems.map(({ game, entry }) => (
              <li key={game.id}>
                <Link href={`/games/${game.slug}`} className="group flex flex-col gap-3">
                  <GameCover
                    title={game.title}
                    imageUrl={game.coverUrl}
                    size="sm"
                    className="w-full transition-transform group-hover:-translate-y-1"
                  />
                  {entry.rating !== null && <HeartRating value={entry.rating} size="xs" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="player-reviews-heading" className="mt-14">
        <h2 id="player-reviews-heading" className="font-pixel text-xl">
          Reviews
        </h2>
        <PlayerReviewList reviews={reviews} />
      </section>
    </main>
  );
}
