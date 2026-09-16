import type { Metadata } from "next";
import Link from "next/link";
import { GameGrid } from "@/components/game-grid";
import { TabLink } from "@/components/tab-link";
import { getCurrentPlayer } from "@/lib/auth";
import { listGames, listGenres } from "@/lib/games";
import { GAMES_MAX_OFFSET, GAMES_PAGE_SIZE } from "@/lib/igdb/games";
import type { GameSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Games",
};

const sortOptions: { value: GameSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
];

function isGameSort(value: unknown): value is GameSort {
  return sortOptions.some((option) => option.value === value);
}

function gamesHref(sort: GameSort, genre?: string) {
  const params = new URLSearchParams();
  if (sort !== "popular") params.set("sort", sort);
  if (genre) params.set("genre", genre);
  const query = params.toString();
  return query ? `/games?${query}` : "/games";
}

export default async function GamesPage(props: PageProps<"/games">) {
  const searchParams = await props.searchParams;
  const sort = isGameSort(searchParams.sort) ? searchParams.sort : "popular";
  const genres = await listGenres();
  const activeGenre = genres.find((item) => item.slug === searchParams.genre);
  const genre = activeGenre?.slug;
  const [games, viewer] = await Promise.all([listGames({ sort, genre }), getCurrentPlayer()]);

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Select a game</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Games
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-y-2 border-dashed border-line py-4">
        <nav aria-label="Sort games" className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <TabLink
              key={option.value}
              href={gamesHref(option.value, genre)}
              active={option.value === sort}
            >
              {option.label}
            </TabLink>
          ))}
        </nav>
        <nav aria-label="Filter by genre" className="flex flex-wrap gap-x-5 gap-y-2 text-sm uppercase">
          {[{ slug: undefined, name: "All" }, ...genres].map((item) => {
            const active = item.slug === genre;
            return (
              <Link
                key={item.slug ?? "all"}
                href={gamesHref(sort, item.slug)}
                aria-current={active ? "page" : undefined}
                className={active ? "text-accent" : "text-ink-soft hover:text-accent"}
              >
                {active ? `> ${item.name}` : item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* A new sort or genre starts a fresh list. */}
      <GameGrid
        key={`${sort}-${genre ?? "all"}`}
        initialItems={games}
        sort={sort}
        genre={genre}
        pageSize={GAMES_PAGE_SIZE}
        maxOffset={GAMES_MAX_OFFSET}
        signedIn={viewer !== null}
        playerPlatforms={viewer?.platforms}
      />
    </main>
  );
}
