import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moveListEntry, removeListEntry } from "@/app/lists/actions";
import { AddGameButton } from "@/components/add-game-button";
import { GameCover } from "@/components/game-cover";
import { LikeButton } from "@/components/like-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { getCurrentPlayer } from "@/lib/auth";
import { formatDate, releaseYear } from "@/lib/format";
import { searchGames } from "@/lib/games";
import { getList, LIST_ITEM_LIMIT, parseListId } from "@/lib/lists";

const SEARCH_RESULTS = 8;
const controlClass =
  "flex h-8 min-w-8 items-center justify-center border-2 border-line px-1.5 font-pixel text-xs disabled:opacity-40";

export async function generateMetadata(props: PageProps<"/lists/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const listId = parseListId(id);
  const list = listId ? await getList(listId) : null;
  if (!list) return { title: "List not found" };
  return {
    title: `${list.title} by ${list.author.username}`,
    description: list.description ?? `${list.itemsCount} games picked by ${list.author.username}.`,
  };
}

export default async function ListPage(props: PageProps<"/lists/[id]">) {
  const { id } = await props.params;
  const listId = parseListId(id);
  if (!listId) notFound();

  const viewer = await getCurrentPlayer();
  const list = await getList(listId, viewer?.id);
  if (!list) notFound();

  const isOwner = viewer?.id === list.author.id;
  const path = `/lists/${list.id}`;
  const searchParams = await props.searchParams;
  const term = isOwner && typeof searchParams.add === "string" ? searchParams.add.trim() : "";
  const results = term ? (await searchGames(term)).slice(0, SEARCH_RESULTS) : [];
  const onList = new Set(list.entries.map((entry) => entry.game.id));
  const full = list.entries.length >= LIST_ITEM_LIMIT;

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <section className="flex max-w-3xl flex-col gap-4">
        <Link
          href={`/players/${encodeURIComponent(list.author.username)}`}
          className="flex w-fit items-center gap-3 text-sm hover:text-accent"
        >
          <PlayerAvatar username={list.author.username} />
          <span>
            <span className="text-muted">List by </span>
            <span className="font-pixel">{list.author.username}</span>
          </span>
        </Link>
        <h1 className="font-pixel text-3xl leading-none font-bold text-balance uppercase [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          {list.title}
        </h1>
        {list.description && (
          <p className="leading-relaxed whitespace-pre-line text-ink-soft">{list.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted uppercase">
          <span>
            {list.itemsCount} {list.itemsCount === 1 ? "game" : "games"}
          </span>
          {list.ranked && <span className="text-p2">Ranked</span>}
          <span>
            Updated <time dateTime={list.updatedAt}>{formatDate(list.updatedAt)}</time>
          </span>
          <LikeButton
            kind="list"
            targetId={list.id}
            likes={list.likes}
            liked={list.likedByViewer}
            signedIn={viewer !== null}
            path={path}
          />
          {isOwner && (
            <Link
              href={`${path}/edit`}
              className="flex h-9 items-center border-2 border-ink px-3 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Edit list
            </Link>
          )}
        </div>
      </section>

      {isOwner && (
        <section aria-labelledby="add-games-heading" className="mt-10 border-y-2 border-dashed border-line py-6">
          <h2 id="add-games-heading" className="font-pixel text-lg">
            Add games
          </h2>
          {full ? (
            <p className="mt-3 text-sm text-muted">This list is full at {LIST_ITEM_LIMIT} games.</p>
          ) : (
            <form action={path} role="search" className="mt-4 flex max-w-xl gap-3">
              <label htmlFor="list-add-search" className="sr-only">
                Game title
              </label>
              <input
                id="list-add-search"
                name="add"
                type="search"
                defaultValue={term}
                placeholder="Search for a game to add"
                autoFocus={list.entries.length === 0 && !term}
                className="h-11 min-w-0 flex-1 border-2 border-line bg-transparent px-3 text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none"
              />
              <button
                type="submit"
                className="h-11 shrink-0 bg-accent px-4 font-pixel text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Search
              </button>
            </form>
          )}

          {term && !full && (
            <div className="mt-5 max-w-xl">
              {results.length === 0 ? (
                <p className="text-sm text-muted">No games match &quot;{term}&quot;.</p>
              ) : (
                <ul className="flex flex-col">
                  {results.map(({ game }) => (
                    <li key={game.id} className="flex items-center gap-4 border-b-2 border-dashed border-line py-3">
                      <GameCover title={game.title} imageUrl={game.coverUrl} size="xs" className="w-10 shrink-0" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-pixel text-sm uppercase">{game.title}</span>
                        <span className="text-xs text-muted">{releaseYear(game.releaseDate)}</span>
                      </div>
                      {onList.has(game.id) ? (
                        <span className="text-xs text-muted uppercase">On list</span>
                      ) : (
                        <AddGameButton listId={list.id} slug={game.slug} title={game.title} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link href={path} className="mt-3 inline-block text-xs text-muted uppercase hover:text-accent">
                Done adding
              </Link>
            </div>
          )}
        </section>
      )}

      <section aria-label="Games on this list" className="mt-10">
        {list.entries.length === 0 ? (
          <p className="text-ink-soft">
            {isOwner ? "Your list is empty. Search above to add the first game." : "No games on this list yet."}
          </p>
        ) : (
          <ol className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {list.entries.map(({ id: entryId, game }, index) => (
              <li key={entryId} className="flex flex-col gap-3">
                <Link href={`/games/${game.slug}`} className="group relative flex flex-col gap-3">
                  <GameCover
                    title={game.title}
                    imageUrl={game.coverUrl}
                    size="sm"
                    className="w-full transition-transform group-hover:-translate-y-1"
                  />
                  {list.ranked && (
                    <span className="absolute -top-3 -left-3 flex h-9 min-w-9 items-center justify-center bg-accent px-1.5 font-pixel text-lg text-screen shadow-[3px_3px_0_var(--color-ink)]">
                      {index + 1}
                    </span>
                  )}
                  <span className="flex flex-col gap-1">
                    <span className="font-pixel text-sm leading-tight uppercase group-hover:text-accent">
                      {game.title}
                    </span>
                    <span className="text-xs text-muted">{releaseYear(game.releaseDate)}</span>
                  </span>
                </Link>

                {isOwner && (
                  <div className="mt-auto flex gap-1.5">
                    {(["up", "down"] as const).map((direction) => {
                      const disabled = direction === "up" ? index === 0 : index === list.entries.length - 1;
                      return (
                        <form key={direction} action={moveListEntry}>
                          <input type="hidden" name="listId" value={list.id} />
                          <input type="hidden" name="entryId" value={entryId} />
                          <input type="hidden" name="direction" value={direction} />
                          <button
                            type="submit"
                            disabled={disabled}
                            aria-label={`Move ${game.title} ${direction === "up" ? "earlier" : "later"}`}
                            className={`${controlClass} enabled:hover:border-accent enabled:hover:text-accent`}
                          >
                            {direction === "up" ? "<" : ">"}
                          </button>
                        </form>
                      );
                    })}
                    <form action={removeListEntry} className="ml-auto">
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="entryId" value={entryId} />
                      <button
                        type="submit"
                        aria-label={`Remove ${game.title} from the list`}
                        className={`${controlClass} hover:border-p1 hover:text-p1`}
                      >
                        X
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
