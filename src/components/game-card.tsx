import Link from "next/link";
import { GameCover } from "@/components/game-cover";
import { releaseYear } from "@/lib/format";
import type { GameListItem } from "@/lib/types";

export function GameCard({ game, stats }: GameListItem) {
  return (
    <Link href={`/games/${game.slug}`} className="group flex flex-col gap-4">
      <GameCover
        title={game.title}
        size="sm"
        className="w-full transition-transform group-hover:-translate-y-1"
      />
      <span className="flex flex-col gap-1.5">
        <span className="font-pixel text-sm leading-tight uppercase group-hover:text-accent">
          {game.title}
        </span>
        <span className="flex items-baseline justify-between text-xs text-muted">
          <span>{releaseYear(game.releaseDate)}</span>
          <span className="font-pixel text-sm text-accent">{stats.average.toFixed(1)}</span>
        </span>
      </span>
    </Link>
  );
}
