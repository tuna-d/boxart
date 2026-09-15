import Link from "next/link";
import { HeartRating } from "@/components/heart-rating";
import { PlayerAvatar } from "@/components/player-avatar";
import { timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/lib/types";

const verbs: Record<ActivityItem["kind"], string> = {
  played: "played",
  playing: "started playing",
  backlog: "added to backlog",
  rated: "rated",
  reviewed: "reviewed",
  list: "made the list",
};

export function ActivityFeed({ items, quotes = true }: { items: ActivityItem[]; quotes?: boolean }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const playerHref = `/players/${encodeURIComponent(item.player.username)}`;
        return (
          <li
            key={item.id}
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-t-2 border-dashed border-line py-3.5 first:border-t-0 first:pt-0"
          >
            <Link href={playerHref} tabIndex={-1} aria-hidden="true">
              <PlayerAvatar username={item.player.username} />
            </Link>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="text-sm leading-snug">
                <Link href={playerHref} className="font-pixel break-all hover:text-accent">
                  {item.player.username}
                </Link>{" "}
                <span className="text-ink-soft">{verbs[item.kind]}</span>{" "}
                {item.kind === "list" ? (
                  <Link href={`/lists/${item.list.id}`} className="text-p2 hover:text-ink">
                    {item.list.title}
                  </Link>
                ) : (
                  <Link href={`/games/${item.game.slug}`} className="text-accent hover:text-ink">
                    {item.game.title}
                  </Link>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {item.kind !== "list" && item.rating !== null && <HeartRating value={item.rating} size="xs" />}
                {item.kind === "list" && (
                  <span className="text-xs text-muted">
                    {item.list.itemsCount} {item.list.itemsCount === 1 ? "game" : "games"}
                  </span>
                )}
                <time dateTime={item.at} className="text-xs text-muted">
                  {timeAgo(item.at)}
                </time>
              </div>
              {quotes && item.kind === "reviewed" && item.review && (
                <p className="line-clamp-2 border-l-[3px] border-accent pl-2.5 text-[13px] leading-relaxed text-ink-soft">
                  {item.review}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
