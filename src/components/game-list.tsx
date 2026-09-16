import Link from "next/link";
import { GameCover } from "@/components/game-cover";
import { QuickLogFrame } from "@/components/quick-log-frame";
import { ViewerGameStatesProvider } from "@/components/viewer-game-states";
import { releaseYear } from "@/lib/format";
import type { PlatformId } from "@/lib/platforms";
import type { GameListItem } from "@/lib/types";

type GameListProps = {
  items: GameListItem[];
  signedIn: boolean;
  playerPlatforms?: PlatformId[];
};

/** A cover grid where signed-in players can shelve games without opening them. */
export function GameList({ items, signedIn, playerPlatforms }: GameListProps) {
  return (
    <ViewerGameStatesProvider
      gameIds={items.map((item) => item.game.id)}
      signedIn={signedIn}
      playerPlatforms={playerPlatforms}
    >
      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {items.map(({ game, stats }) => (
          <li key={game.id}>
            <QuickLogFrame game={game}>
              <Link href={`/games/${game.slug}`} draggable={false} className="flex flex-col gap-4">
                <GameCover
                  title={game.title}
                  imageUrl={game.coverUrl}
                  size="sm"
                  className="w-full transition-transform group-hover:-translate-y-1"
                />
                <span className="flex flex-col gap-1.5">
                  <span className="font-pixel text-sm leading-tight uppercase group-hover:text-accent">
                    {game.title}
                  </span>
                  <span className="flex items-baseline justify-between text-xs text-muted">
                    <span>{releaseYear(game.releaseDate)}</span>
                    {stats.count > 0 && (
                      <span className="font-pixel text-sm text-accent">{stats.average.toFixed(1)}</span>
                    )}
                  </span>
                </span>
              </Link>
            </QuickLogFrame>
          </li>
        ))}
      </ul>
    </ViewerGameStatesProvider>
  );
}
