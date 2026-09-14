import type { Metadata } from "next";
import Link from "next/link";
import { GameCover } from "@/components/game-cover";
import { PlayerAvatar } from "@/components/player-avatar";
import { TabLink } from "@/components/tab-link";
import { formatMonthYear } from "@/lib/format";
import { listPlayers } from "@/lib/players";
import type { PlayerSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Players",
};

const sortOptions: { value: PlayerSort; label: string }[] = [
  { value: "active", label: "Most games" },
  { value: "liked", label: "Most liked" },
  { value: "newest", label: "New players" },
];

function isPlayerSort(value: unknown): value is PlayerSort {
  return sortOptions.some((option) => option.value === value);
}

function playersHref(sort: PlayerSort, query: string) {
  const params = new URLSearchParams();
  if (sort !== "active") params.set("sort", sort);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/players?${search}` : "/players";
}

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? word : `${word}s`}`;
}

export default async function PlayersPage(props: PageProps<"/players">) {
  const searchParams = await props.searchParams;
  const sort = isPlayerSort(searchParams.sort) ? searchParams.sort : "active";
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const players = await listPlayers({ sort, query });

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Player select</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Players
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-y-2 border-dashed border-line py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Sort players" className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <TabLink key={option.value} href={playersHref(option.value, query)} active={option.value === sort}>
              {option.label}
            </TabLink>
          ))}
        </nav>
        <form action="/players" role="search" className="flex gap-2">
          {sort !== "active" && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="player-search" className="sr-only">
            Username
          </label>
          <input
            id="player-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Find a player"
            maxLength={20}
            className="h-10 w-full min-w-0 border-2 border-line bg-transparent px-3 text-sm text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none lg:w-56"
          />
          <button
            type="submit"
            className="h-10 shrink-0 border-2 border-ink px-3.5 text-sm font-semibold uppercase hover:border-accent hover:text-accent"
          >
            Find
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-muted uppercase">
        {query && players.length === 0 ? `No players match "${query}"` : plural(players.length, "player")}
      </p>

      <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {players.map(({ player, gamesCount, reviewsCount, likesReceived, recentGames }) => {
          const href = `/players/${encodeURIComponent(player.username)}`;
          return (
            <li key={player.id} className="relative flex flex-col gap-5 border-2 border-line p-5 hover:border-accent">
              <div className="flex items-center gap-4">
                <PlayerAvatar username={player.username} />
                <div className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={href}
                    className="truncate font-pixel text-lg leading-none uppercase after:absolute after:inset-0 hover:text-accent"
                  >
                    {player.username}
                  </Link>
                  <span className="text-xs text-muted uppercase">Joined {formatMonthYear(player.joinedAt)}</span>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Games", value: gamesCount },
                  { label: "Reviews", value: reviewsCount },
                  { label: "Likes", value: likesReceived },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse gap-1 bg-shade/40 py-2">
                    <dt className="text-xs text-muted uppercase">{stat.label}</dt>
                    <dd className="font-pixel text-2xl text-accent">{stat.value.toLocaleString("en-US")}</dd>
                  </div>
                ))}
              </dl>

              {recentGames.length > 0 ? (
                <ul aria-label={`Latest games on ${player.username}'s shelf`} className="grid grid-cols-4 gap-3">
                  {recentGames.map((game) => (
                    <li key={game.slug}>
                      <GameCover title={game.title} imageUrl={game.coverUrl} size="xs" className="w-full" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No games on the shelf yet.</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
