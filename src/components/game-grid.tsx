"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadMoreGames } from "@/app/games/actions";
import { GameList } from "@/components/game-list";
import type { PlatformId } from "@/lib/platforms";
import type { GameListItem, GameSort } from "@/lib/types";

type GameGridProps = {
  initialItems: GameListItem[];
  sort: GameSort;
  genre?: string;
  pageSize: number;
  maxOffset: number;
  signedIn: boolean;
  playerPlatforms?: PlatformId[];
};

type Status = "idle" | "loading" | "done" | "error";

export function GameGrid({ initialItems, sort, genre, pageSize, maxOffset, signedIn, playerPlatforms }: GameGridProps) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<Status>(initialItems.length < pageSize ? "done" : "idle");
  // Counts every row IGDB returned, including repeats, so the next offset stays right.
  const offsetRef = useRef(initialItems.length);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await loadMoreGames({ sort, genre, offset: offsetRef.current });
      offsetRef.current += next.length;
      setItems((current) => {
        // Games with equal sort values can move between pages, so skip ones already shown.
        const seen = new Set(current.map((item) => item.game.id));
        return [...current, ...next.filter((item) => !seen.has(item.game.id))];
      });
      setStatus(next.length < pageSize || offsetRef.current >= maxOffset ? "done" : "idle");
    } catch {
      setStatus("error");
    }
  }, [sort, genre, pageSize, maxOffset]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || status !== "idle") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "900px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, loadMore]);

  return (
    <>
      <p className="mt-6 text-sm text-muted uppercase">
        {items.length} {items.length === 1 ? "game" : "games"}
      </p>

      <GameList items={items} signedIn={signedIn} playerPlatforms={playerPlatforms} />

      <div ref={sentinelRef} className="mt-12 flex min-h-12 items-center justify-center" aria-live="polite">
        {status === "loading" && (
          <span className="font-pixel text-sm text-p2">
            Loading more games<span className="motion-safe:animate-pulse">_</span>
          </span>
        )}
        {status === "idle" && (
          // Scrolling loads the next page on its own. The button is there for keyboards and slow observers.
          <button
            type="button"
            onClick={() => void loadMore()}
            className="h-11 border-2 border-ink px-4 text-sm font-semibold uppercase hover:border-accent hover:text-accent"
          >
            Load more
          </button>
        )}
        {status === "error" && (
          <span className="flex flex-wrap items-center justify-center gap-4 text-sm text-p1">
            Could not load more games.
            <button
              type="button"
              onClick={() => void loadMore()}
              className="h-10 border-2 border-p1 px-3.5 font-semibold uppercase hover:bg-p1 hover:text-screen"
            >
              Try again
            </button>
          </span>
        )}
        {status === "done" && items.length > pageSize && (
          <span className="font-pixel text-sm text-muted">End of the list</span>
        )}
      </div>
    </>
  );
}
