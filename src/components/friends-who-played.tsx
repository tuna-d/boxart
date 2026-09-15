import Link from "next/link";
import { HeartRating } from "@/components/heart-rating";
import { PlayerAvatar } from "@/components/player-avatar";
import type { FriendPlay } from "@/lib/types";

const SHOWN_AVATARS = 5;
const NAMED = 2;

export function FriendsWhoPlayed({ plays, gameTitle }: { plays: FriendPlay[]; gameTitle: string }) {
  if (plays.length === 0) return null;

  const rated = plays.filter((play) => play.rating !== null);
  const average = rated.length
    ? Math.round((rated.reduce((sum, play) => sum + (play.rating ?? 0), 0) / rated.length) * 2) / 2
    : null;
  const named = plays.slice(0, NAMED);
  const others = plays.length - named.length;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-line pt-4 text-sm">
      <span className="flex">
        {plays.slice(0, SHOWN_AVATARS).map((play, index) => (
          <Link
            key={play.player.id}
            href={`/players/${encodeURIComponent(play.player.username)}`}
            title={play.player.username}
            className={`ring-2 ring-screen ${index > 0 ? "-ml-2" : ""}`}
          >
            <PlayerAvatar username={play.player.username} />
          </Link>
        ))}
      </span>
      <p className="text-ink-soft">
        {named.map((play, index) => (
          <span key={play.player.id}>
            {index > 0 && (others > 0 ? ", " : " and ")}
            <Link
              href={`/players/${encodeURIComponent(play.player.username)}`}
              className="font-pixel text-ink hover:text-accent"
            >
              {play.player.username}
            </Link>
          </span>
        ))}
        {others > 0 && ` and ${others} more ${others === 1 ? "friend" : "friends"}`}{" "}
        {plays.length === 1 ? `has ${gameTitle} on their shelf` : `have ${gameTitle} on their shelves`}
      </p>
      {average !== null && (
        <span className="flex items-center gap-2">
          <HeartRating value={average} size="xs" />
          <span className="text-xs text-muted uppercase">Friends avg</span>
        </span>
      )}
    </div>
  );
}
