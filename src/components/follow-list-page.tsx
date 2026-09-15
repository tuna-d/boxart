import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { TabLink } from "@/components/tab-link";
import { getCurrentPlayer } from "@/lib/auth";
import { getFollowCounts, getFollowingIds, getFollowPlayers } from "@/lib/follows";
import { getPlayer } from "@/lib/players";

type FollowListPageProps = {
  username: string;
  direction: "followers" | "following";
};

export async function FollowListPage({ username, direction }: FollowListPageProps) {
  const player = await getPlayer(username);
  if (!player) notFound();

  const viewer = await getCurrentPlayer();
  const [players, counts, viewerFollowing] = await Promise.all([
    getFollowPlayers(player.id, direction),
    getFollowCounts(player.id),
    viewer ? getFollowingIds(viewer.id) : ([] as string[]),
  ]);
  const following = new Set(viewerFollowing);
  const profileHref = `/players/${encodeURIComponent(player.username)}`;
  const path = `${profileHref}/${direction}`;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-10 pb-16">
      <div className="flex flex-col gap-4">
        <Link href={profileHref} className="flex w-fit items-center gap-3 font-pixel text-sm text-p2 hover:text-ink">
          &lt; {player.username}
        </Link>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          {direction === "followers" ? "Followers" : "Following"}
        </h1>
      </div>

      <nav aria-label="Follows" className="mt-8 flex flex-wrap gap-2">
        <TabLink href={`${profileHref}/followers`} active={direction === "followers"}>
          Followers · {counts.followers}
        </TabLink>
        <TabLink href={`${profileHref}/following`} active={direction === "following"}>
          Following · {counts.following}
        </TabLink>
      </nav>

      {players.length === 0 ? (
        <p className="mt-8 text-ink-soft">
          {direction === "followers"
            ? `Nobody follows ${player.username} yet.`
            : `${player.username} does not follow anyone yet.`}
        </p>
      ) : (
        <ul className="mt-8 border-t-2 border-dashed border-line">
          {players.map((item) => (
            <li key={item.id} className="flex items-center gap-4 border-b-2 border-dashed border-line py-4">
              <PlayerAvatar username={item.username} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/players/${encodeURIComponent(item.username)}`}
                  className="truncate font-pixel hover:text-accent"
                >
                  {item.username}
                </Link>
                {item.bio && <span className="line-clamp-1 text-xs text-muted">{item.bio}</span>}
              </div>
              {viewer?.id !== item.id && (
                <FollowButton
                  targetId={item.id}
                  username={item.username}
                  following={following.has(item.id)}
                  signedIn={viewer !== null}
                  path={path}
                  size="sm"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
