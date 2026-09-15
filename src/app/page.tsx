import Link from "next/link";
import { ActivityFeed } from "@/components/activity-feed";
import { FollowButton } from "@/components/follow-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { getCurrentPlayer, type CurrentPlayer } from "@/lib/auth";
import { getFollowingIds, getFriendActivity } from "@/lib/follows";
import { listPlayers } from "@/lib/players";

const FEED_SIZE = 6;
const SUGGESTIONS = 3;

export default async function Home() {
  const player = await getCurrentPlayer();
  const signedIn = player !== null && !player.needsUsername && player.username !== null;

  return (
    <main className="px-6 py-20 md:px-10 md:py-28">
      <div
        className={
          signedIn ? "grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-16" : undefined
        }
      >
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="font-pixel text-sm text-p2">
            &gt; {signedIn ? `Welcome back, 1P ${player.username}` : "Press start"}
          </span>
          <h1 className="font-pixel text-4xl leading-tight font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-6xl">
            Keep score of every game you play
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink-soft">
            Log what you played, rate it with hearts and post your review to the high-score table.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <Link
              href={signedIn ? "/games" : "/sign-up"}
              className="flex h-13 items-center bg-p1 px-6 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {signedIn ? "Log a game" : "Insert coin"}
            </Link>
            <Link href="/games" className="text-sm font-semibold text-ink-soft hover:text-accent">
              [ Browse games ]
            </Link>
          </div>
        </div>

        {signedIn && <FriendsMonitor player={player} />}
      </div>
    </main>
  );
}

async function FriendsMonitor({ player }: { player: CurrentPlayer }) {
  const [followingIds, activity] = await Promise.all([
    getFollowingIds(player.id),
    getFriendActivity(player.id, FEED_SIZE),
  ]);

  return (
    <aside aria-labelledby="friends-feed-heading" className="flex flex-col gap-4 border-2 border-line bg-shade/15 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id="friends-feed-heading" className="font-pixel text-[15px]">
          Friends feed
        </h2>
        {activity.length > 0 && (
          <span className="flex items-center gap-2 font-pixel text-xs text-p1">
            <span aria-hidden="true" className="h-2 w-2 bg-p1 motion-safe:animate-pulse" />
            Live
          </span>
        )}
      </div>

      {activity.length > 0 ? (
        <>
          <ActivityFeed items={activity} />
          <Link href="/activity" className="w-fit text-sm font-semibold text-accent uppercase hover:text-ink">
            See all activity &gt;
          </Link>
        </>
      ) : (
        <PlayerSuggestions
          playerId={player.id}
          followingIds={followingIds}
          intro={
            followingIds.length === 0
              ? "Follow a few players and their ratings, reviews and lists show up here."
              : "Your friends have been quiet. Find a few more players to follow."
          }
        />
      )}
    </aside>
  );
}

async function PlayerSuggestions({
  playerId,
  followingIds,
  intro,
}: {
  playerId: string;
  followingIds: string[];
  intro: string;
}) {
  const following = new Set(followingIds);
  const suggestions = (await listPlayers({ sort: "active" }))
    .filter(({ player }) => player.id !== playerId && !following.has(player.id))
    .slice(0, SUGGESTIONS);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-soft">{intro}</p>
      {suggestions.length > 0 && (
        <>
          <span className="font-pixel text-xs text-muted">Players to follow</span>
          <ul className="flex flex-col gap-3">
            {suggestions.map(({ player, gamesCount }) => (
              <li key={player.id} className="flex items-center gap-3">
                <PlayerAvatar username={player.username} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/players/${encodeURIComponent(player.username)}`}
                    className="truncate font-pixel text-sm hover:text-accent"
                  >
                    {player.username}
                  </Link>
                  <span className="text-xs text-muted">
                    {gamesCount} {gamesCount === 1 ? "game" : "games"}
                  </span>
                </div>
                <FollowButton targetId={player.id} username={player.username} following={false} signedIn path="/" size="sm" />
              </li>
            ))}
          </ul>
        </>
      )}
      <Link href="/players" className="w-fit text-sm font-semibold text-accent uppercase hover:text-ink">
        Browse players &gt;
      </Link>
    </div>
  );
}
