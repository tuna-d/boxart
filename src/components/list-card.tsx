import Link from "next/link";
import { GameCover } from "@/components/game-cover";
import { PixelHeart } from "@/components/heart-rating";
import type { ListSummary } from "@/lib/types";

const STACK_SIZE = 5;

type ListCardProps = {
  list: ListSummary;
  /** Hide the author line, for lists shown on the author's own profile. */
  hideAuthor?: boolean;
};

export function ListCard({ list, hideAuthor = false }: ListCardProps) {
  const emptySlots = Math.max(STACK_SIZE - list.previewGames.length, 0);

  return (
    <article className="group relative flex flex-col gap-4">
      <div aria-hidden="true" className="flex pr-3 pb-1 pl-1">
        {list.previewGames.map((game, index) => (
          <GameCover
            key={game.slug}
            title={game.title}
            imageUrl={game.coverUrl}
            size="xs"
            className={`w-[30%] shrink-0 transition-transform group-hover:-translate-y-1 ${index > 0 ? "-ml-[12.5%]" : ""}`}
          />
        ))}
        {Array.from({ length: emptySlots }, (_, index) => (
          <div
            key={index}
            className={`aspect-[3/4] w-[30%] shrink-0 border-2 border-dashed border-line bg-screen ${
              list.previewGames.length + index > 0 ? "-ml-[12.5%]" : ""
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-pixel text-base leading-tight uppercase">
          <Link href={`/lists/${list.id}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {list.title}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted uppercase">
          {!hideAuthor && <span className="text-ink-soft normal-case">by {list.author.username}</span>}
          <span>
            {list.itemsCount} {list.itemsCount === 1 ? "game" : "games"}
          </span>
          {list.ranked && <span className="text-p2">Ranked</span>}
          <span className="flex items-center gap-1">
            <span className="relative h-2.5 w-3">
              <PixelHeart className={list.likedByViewer ? "text-p1" : "text-line"} />
            </span>
            {list.likes}
            <span className="sr-only">likes</span>
          </span>
        </p>
      </div>
    </article>
  );
}
