import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { ListCard } from "@/components/list-card";
import { PlatformBadges } from "@/components/platform-badges";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerReviewList } from "@/components/player-review-list";
import { ScorePanel } from "@/components/score-panel";
import { ShelfCard } from "@/components/shelf-card";
import { TabLink } from "@/components/tab-link";
import { formatMonthYear } from "@/lib/format";
import { getCurrentPlayer } from "@/lib/auth";
import { getDiaryCount } from "@/lib/diary";
import { getFollowCounts, getFollowingIds } from "@/lib/follows";
import { getPlayerReviews, getPlayerShelf, getShelfStats } from "@/lib/library";
import { getLists } from "@/lib/lists";
import { getPlayer } from "@/lib/players";
import type { ShelfFilter, ShelfSort } from "@/lib/types";

const PAGE_SIZE = 48;
const MAX_SHOWN = 480;

const shelves: { value: ShelfFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "played", label: "Played" },
  { value: "playing", label: "Playing" },
  { value: "backlog", label: "Backlog" },
  { value: "rated", label: "Rated" },
];

const sortOptions: { value: ShelfSort; label: string }[] = [
  { value: "recent", label: "Recently logged" },
  { value: "rating-high", label: "Highest rated" },
  { value: "rating-low", label: "Lowest rated" },
  { value: "title", label: "A-Z" },
];

function isShelf(value: unknown): value is ShelfFilter {
  return shelves.some((shelf) => shelf.value === value);
}

function isShelfSort(value: unknown): value is ShelfSort {
  return sortOptions.some((option) => option.value === value);
}

function shelfHref(base: string, shelf: ShelfFilter, sort: ShelfSort, shown = PAGE_SIZE) {
  const params = new URLSearchParams();
  if (shelf !== "all") params.set("shelf", shelf);
  if (sort !== "recent") params.set("sort", sort);
  if (shown > PAGE_SIZE) params.set("shown", String(shown));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export async function generateMetadata(props: PageProps<"/players/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const player = await getPlayer(username);
  return player ? { title: player.username, description: player.bio } : { title: "Player not found" };
}

export default async function PlayerPage(props: PageProps<"/players/[username]">) {
  const { username } = await props.params;
  const player = await getPlayer(username);
  if (!player) notFound();

  const searchParams = await props.searchParams;
  const shelf = isShelf(searchParams.shelf) ? searchParams.shelf : "all";
  const sort = isShelfSort(searchParams.sort) ? searchParams.sort : "recent";
  const requested = Number(searchParams.shown);
  const shown = Number.isInteger(requested) ? Math.min(Math.max(requested, PAGE_SIZE), MAX_SHOWN) : PAGE_SIZE;
  const viewer = await getCurrentPlayer();
  const isOwnProfile = viewer?.id === player.id;
  const [stats, shelfPage, reviews, lists, followCounts, viewerFollowing, playerFollowing, diaryCount] =
    await Promise.all([
      getShelfStats(player.id),
      getPlayerShelf(player.id, { filter: shelf, sort, limit: shown }),
      getPlayerReviews(player, viewer?.id),
      getLists({ sort: "recent", authorId: player.id, viewerId: viewer?.id }),
      getFollowCounts(player.id),
      viewer && !isOwnProfile ? getFollowingIds(viewer.id) : ([] as string[]),
      viewer && !isOwnProfile ? getFollowingIds(player.id) : ([] as string[]),
      getDiaryCount(player.id),
    ]);
  const viewerFollows = viewerFollowing.includes(player.id);
  const followsViewer = viewer !== null && playerFollowing.includes(viewer.id);
  const { counts } = stats;
  const profileHref = `/players/${encodeURIComponent(player.username)}`;

  const counters: { label: string; value: number; href?: string }[] = [
    { label: "Played", value: counts.played },
    { label: "Playing", value: counts.playing },
    { label: "Backlog", value: counts.backlog },
    { label: "Diary", value: diaryCount, href: `${profileHref}/diary` },
    { label: "Reviews", value: reviews.length },
    { label: "Lists", value: lists.length },
  ];

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <section className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <PlayerAvatar username={player.username} size="lg" />
        <div className="flex min-w-0 flex-col gap-3">
          <span className="font-pixel text-sm text-p2">&gt; Player profile</span>
          <h1 className="font-pixel text-3xl leading-none font-bold break-all uppercase [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
            {player.username}
          </h1>
          {player.bio && <p className="max-w-xl whitespace-pre-line text-ink-soft">{player.bio}</p>}
          <PlatformBadges platforms={player.platforms} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase">
            <Link href={`${profileHref}/followers`} className="text-ink-soft hover:text-accent">
              <span className="font-pixel text-sm text-accent">{followCounts.followers}</span>{" "}
              {followCounts.followers === 1 ? "follower" : "followers"}
            </Link>
            <Link href={`${profileHref}/following`} className="text-ink-soft hover:text-accent">
              <span className="font-pixel text-sm text-accent">{followCounts.following}</span> following
            </Link>
            <span className="text-muted">Joined {formatMonthYear(player.joinedAt)}</span>
            {followsViewer && <span className="border-2 border-line px-1.5 py-0.5 text-muted">Follows you</span>}
          </div>
        </div>
        {isOwnProfile ? (
          <Link
            href="/settings"
            className="flex h-11 w-fit shrink-0 items-center border-2 border-ink px-4 text-sm font-semibold uppercase hover:border-accent hover:text-accent md:ml-auto"
          >
            Settings
          </Link>
        ) : (
          <div className="md:ml-auto">
            <FollowButton
              targetId={player.id}
              username={player.username}
              following={viewerFollows}
              signedIn={viewer !== null}
              path={profileHref}
            />
          </div>
        )}
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-y-2 border-y-2 border-dashed border-line py-5 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((counter) => (
          <div key={counter.label} className="group relative flex flex-col gap-2">
            <dt className="font-pixel text-sm text-muted">
              {counter.href ? (
                <Link href={counter.href} className="after:absolute after:inset-0 group-hover:text-ink">
                  {counter.label} &gt;
                </Link>
              ) : (
                counter.label
              )}
            </dt>
            <dd className={`font-pixel text-4xl text-accent ${counter.href ? "group-hover:underline" : ""}`}>
              {counter.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="shelves-heading" className="min-w-0">
          <h2 id="shelves-heading" className="font-pixel text-xl">
            Games
          </h2>
          <div className="mt-5 flex flex-col gap-4 border-y-2 border-dashed border-line py-4">
            <nav aria-label="Shelves" className="flex flex-wrap gap-2">
              {shelves.map((item) => (
                <TabLink key={item.value} href={shelfHref(profileHref, item.value, sort)} active={item.value === shelf}>
                  {item.label} · {counts[item.value]}
                </TabLink>
              ))}
            </nav>
            <nav aria-label="Sort games" className="flex flex-wrap gap-x-5 gap-y-2 text-sm uppercase">
              {sortOptions.map((option) => {
                const active = option.value === sort;
                return (
                  <Link
                    key={option.value}
                    href={shelfHref(profileHref, shelf, option.value)}
                    aria-current={active ? "page" : undefined}
                    className={active ? "text-accent" : "text-ink-soft hover:text-accent"}
                  >
                    {active ? `> ${option.label}` : option.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {shelfPage.items.length === 0 ? (
            <p className="mt-8 text-ink-soft">
              {shelf === "rated" ? "No rated games yet." : "Nothing on this shelf yet."}
            </p>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {shelfPage.items.map((item) => (
                <li key={item.game.id}>
                  <ShelfCard {...item} showStatus={shelf === "all" || shelf === "rated"} />
                </li>
              ))}
            </ul>
          )}

          {shelfPage.hasMore && shown < MAX_SHOWN && (
            <Link
              href={shelfHref(profileHref, shelf, sort, shown + PAGE_SIZE)}
              scroll={false}
              className="mt-10 flex h-11 w-fit items-center border-2 border-ink px-4 text-sm font-semibold uppercase hover:border-accent hover:text-accent"
            >
              Load more
            </Link>
          )}
        </section>

        <div className="lg:pt-12">
          <ScorePanel
            stats={stats.ratings}
            title="Ratings"
            countNoun="game"
            label={`${player.username}'s ratings`}
          />
        </div>
      </div>

      <section aria-labelledby="player-lists-heading" className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="player-lists-heading" className="font-pixel text-xl">
            Lists
          </h2>
          {isOwnProfile && (
            <Link href="/lists/new" className="text-sm font-semibold text-accent uppercase hover:text-ink">
              + New list
            </Link>
          )}
        </div>
        {lists.length === 0 ? (
          <p className="mt-5 text-ink-soft">No lists yet.</p>
        ) : (
          <ul className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {lists.map((list) => (
              <li key={list.id}>
                <ListCard list={list} hideAuthor />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="player-reviews-heading" className="mt-14">
        <h2 id="player-reviews-heading" className="font-pixel text-xl">
          Reviews
        </h2>
        <PlayerReviewList reviews={reviews} signedIn={viewer !== null} path={profileHref} />
      </section>
    </main>
  );
}
