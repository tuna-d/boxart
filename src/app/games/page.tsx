import type { Metadata } from "next";
import Link from "next/link";
import { GameCard } from "@/components/game-card";
import { listGames, listGenres } from "@/lib/games";
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
  const genre =
    typeof searchParams.genre === "string" && genres.includes(searchParams.genre)
      ? searchParams.genre
      : undefined;
  const games = await listGames({ sort, genre });

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Select a game</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Games
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-y-2 border-dashed border-line py-4">
        <nav aria-label="Sort games" className="flex flex-wrap gap-2 text-sm font-semibold uppercase">
          {sortOptions.map((option) => {
            const active = option.value === sort;
            return (
              <Link
                key={option.value}
                href={gamesHref(option.value, genre)}
                aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center border-2 px-3.5 ${
                  active ? "border-accent bg-accent text-screen" : "border-ink hover:border-accent hover:text-accent"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
        <nav aria-label="Filter by genre" className="flex flex-wrap gap-x-5 gap-y-2 text-sm uppercase">
          {[undefined, ...genres].map((item) => {
            const active = item === genre;
            return (
              <Link
                key={item ?? "all"}
                href={gamesHref(sort, item)}
                aria-current={active ? "page" : undefined}
                className={active ? "text-accent" : "text-ink-soft hover:text-accent"}
              >
                {active ? `> ${item ?? "All"}` : (item ?? "All")}
              </Link>
            );
          })}
        </nav>
      </div>

      <p className="mt-6 text-sm text-muted uppercase">
        {games.length} {games.length === 1 ? "game" : "games"}
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {games.map((item) => (
          <li key={item.game.id}>
            <GameCard {...item} />
          </li>
        ))}
      </ul>
    </main>
  );
}
