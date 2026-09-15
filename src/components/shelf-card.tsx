import Link from "next/link";
import { GameCover } from "@/components/game-cover";
import { HeartRating } from "@/components/heart-rating";
import type { LibraryItem } from "@/lib/types";

const statusLabels = {
  played: "Played",
  playing: "Playing",
  backlog: "Backlog",
};

type ShelfCardProps = LibraryItem & {
  /** Name the shelf on the card when games from every shelf are shown together. */
  showStatus?: boolean;
};

export function ShelfCard({ game, entry, showStatus = false }: ShelfCardProps) {
  const details = [
    showStatus && statusLabels[entry.status],
    entry.platform,
    entry.hoursPlayed !== null && `${entry.hoursPlayed}h`,
  ].filter(Boolean);

  return (
    <Link href={`/games/${game.slug}`} className="group flex flex-col gap-3">
      <GameCover
        title={game.title}
        imageUrl={game.coverUrl}
        size="sm"
        className="w-full transition-transform group-hover:-translate-y-1"
      />
      <span className="flex flex-col gap-1.5">
        <span className="line-clamp-2 font-pixel text-[13px] leading-tight uppercase group-hover:text-accent">
          {game.title}
        </span>
        {entry.rating !== null && <HeartRating value={entry.rating} size="xs" />}
        {details.length > 0 && <span className="text-xs text-muted">{details.join(" · ")}</span>}
      </span>
    </Link>
  );
}
