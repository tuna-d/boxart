import type { Metadata } from "next";
import { GameList } from "@/components/game-list";
import { LiveQueryInput } from "@/components/live-query-input";
import { getCurrentPlayer } from "@/lib/auth";
import { searchGames } from "@/lib/games";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const { q } = await props.searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  return { title: term ? `Search: ${term}` : "Search" };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  const [results, viewer] = await Promise.all([term ? searchGames(term) : [], getCurrentPlayer()]);

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Search</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Find a game
        </h1>
      </div>

      <form action="/search" role="search" className="mt-8 flex max-w-2xl gap-3">
        <label htmlFor="search-page-input" className="sr-only">
          Game title
        </label>
        <LiveQueryInput
          id="search-page-input"
          path="/search"
          delay={450}
          defaultValue={term}
          placeholder="Type a game title"
          autoFocus={!term}
          className="h-12 min-w-0 flex-1 border-2 border-line bg-transparent px-3 text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none"
        />
        <button
          type="submit"
          className="h-12 shrink-0 px-5 font-pixel key-button key-button-yellow"
        >
          Search
        </button>
      </form>

      {term && (
        <p className="mt-8 text-sm text-muted uppercase">
          {results.length === 0
            ? `No games match "${term}"`
            : `${results.length} ${results.length === 1 ? "result" : "results"} for "${term}"`}
        </p>
      )}

      {results.length > 0 && (
        <GameList items={results} signedIn={viewer !== null} />
      )}
    </main>
  );
}
