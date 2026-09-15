import { createClient } from "@/lib/supabase/server";
import type {
  Game,
  GameListItem,
  GameSummary,
  LibraryEntry,
  LibraryItem,
  LibraryStatus,
  PlayerReview,
  RatingStats,
  Review,
  ReviewDetail,
  ShelfFilter,
  ShelfSort,
  ShelfStats,
} from "./types";

const ENTRY_COLUMNS =
  "id, status, rating, platform, hours_played, review, likes_count, replies_count, created_at, updated_at, " +
  "game_id, game_slug, game_title, game_cover_url, game_release_date";

type EntryRow = {
  id: number;
  status: LibraryStatus;
  rating: number | null;
  platform: string | null;
  hours_played: number | null;
  review: string | null;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
  game_id: number;
  game_slug: string;
  game_title: string;
  game_cover_url: string | null;
  game_release_date: string | null;
  profiles?: { username: string } | null;
};

const emptyStats: RatingStats = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };

function toEntry(row: EntryRow): LibraryEntry {
  return {
    id: String(row.id),
    status: row.status,
    rating: row.rating === null ? null : Number(row.rating),
    platform: row.platform,
    hoursPlayed: row.hours_played,
    review: row.review,
    updatedAt: row.updated_at,
  };
}

function toGameSummary(row: EntryRow): GameSummary {
  return {
    id: String(row.game_id),
    slug: row.game_slug,
    title: row.game_title,
    coverUrl: row.game_cover_url,
    releaseDate: row.game_release_date,
  };
}

function toReview(row: EntryRow, likedIds: Set<number>, username?: string): Review {
  return {
    id: String(row.id),
    author: { username: username ?? row.profiles?.username ?? "unknown" },
    rating: row.rating === null ? null : Number(row.rating),
    body: row.review ?? "",
    platform: row.platform,
    hoursPlayed: row.hours_played,
    likes: row.likes_count,
    likedByViewer: likedIds.has(row.id),
    replies: row.replies_count,
    createdAt: row.created_at,
  };
}

async function likedEntryIds(entryIds: number[], viewerId: string | undefined) {
  if (!viewerId || entryIds.length === 0) return new Set<number>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("review_likes")
    .select("entry_id")
    .eq("user_id", viewerId)
    .in("entry_id", entryIds);
  return new Set((data ?? []).map((like) => like.entry_id as number));
}

export async function getRatingStats(game: Pick<Game, "id">): Promise<RatingStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("game_rating_stats", { target_game_id: Number(game.id) })
    .maybeSingle<{
      average: number;
      rating_count: number;
      one_heart: number;
      two_hearts: number;
      three_hearts: number;
      four_hearts: number;
      five_hearts: number;
    }>();
  if (error) throw new Error(`Could not load rating stats: ${error.message}`);
  if (!data) return emptyStats;

  return {
    average: Number(data.average),
    count: Number(data.rating_count),
    distribution: [
      Number(data.one_heart),
      Number(data.two_hearts),
      Number(data.three_hearts),
      Number(data.four_hearts),
      Number(data.five_hearts),
    ],
  };
}

export async function withRatingSummaries(games: Game[]): Promise<GameListItem[]> {
  if (games.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("games_rating_summary", {
    game_ids: games.map((game) => Number(game.id)),
  });
  if (error) throw new Error(`Could not load rating summaries: ${error.message}`);

  const summaries = new Map(
    ((data ?? []) as { game_id: number; average: number; rating_count: number }[]).map((row) => [
      String(row.game_id),
      { average: Number(row.average), count: Number(row.rating_count) },
    ]),
  );
  return games.map((game) => ({ game, stats: summaries.get(game.id) ?? { average: 0, count: 0 } }));
}

export async function getPopularReviews(
  game: Pick<Game, "id">,
  viewerId?: string,
  limit = 10,
): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select(`${ENTRY_COLUMNS}, profiles!library_entries_user_id_fkey (username)`)
    .eq("game_id", Number(game.id))
    .not("review", "is", null)
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<EntryRow[], { merge: false }>();
  if (error) throw new Error(`Could not load reviews: ${error.message}`);

  const rows = data ?? [];
  const liked = await likedEntryIds(rows.map((row) => row.id), viewerId);
  return rows.map((row) => toReview(row, liked));
}

export async function getViewerEntry(game: Pick<Game, "id">, viewerId: string): Promise<LibraryEntry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select(ENTRY_COLUMNS)
    .eq("user_id", viewerId)
    .eq("game_id", Number(game.id))
    .maybeSingle()
    .overrideTypes<EntryRow | null, { merge: false }>();
  if (error) throw new Error(`Could not load your shelf entry: ${error.message}`);
  return data ? toEntry(data) : null;
}

/** Counts for every shelf tab and the player's rating spread, from two light columns per entry. */
export async function getShelfStats(playerId: string): Promise<ShelfStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select("status, rating")
    .eq("user_id", playerId)
    .overrideTypes<{ status: LibraryStatus; rating: number | null }[], { merge: false }>();
  if (error) throw new Error(`Could not load the shelf: ${error.message}`);

  const counts: Record<ShelfFilter, number> = { all: 0, played: 0, playing: 0, backlog: 0, rated: 0 };
  const distribution: RatingStats["distribution"] = [0, 0, 0, 0, 0];
  let total = 0;
  for (const { status, rating } of data ?? []) {
    counts.all += 1;
    counts[status] += 1;
    if (rating === null) continue;
    const value = Number(rating);
    counts.rated += 1;
    total += value;
    // Same buckets as the game page: up to one heart, up to two, and so on.
    distribution[Math.min(Math.ceil(value) - 1, 4)] += 1;
  }

  return {
    counts,
    ratings: {
      average: counts.rated ? Math.round((total / counts.rated) * 10) / 10 : 0,
      count: counts.rated,
      distribution,
    },
  };
}

export async function getPlayerShelf(
  playerId: string,
  { filter, sort, limit }: { filter: ShelfFilter; sort: ShelfSort; limit: number },
): Promise<{ items: LibraryItem[]; hasMore: boolean }> {
  const supabase = await createClient();
  let request = supabase.from("library_entries").select(ENTRY_COLUMNS).eq("user_id", playerId);

  if (filter === "rated") request = request.not("rating", "is", null);
  else if (filter !== "all") request = request.eq("status", filter);

  if (sort === "rating-high") request = request.order("rating", { ascending: false, nullsFirst: false });
  if (sort === "rating-low") request = request.order("rating", { ascending: true, nullsFirst: false });
  if (sort === "title") request = request.order("game_title", { ascending: true });

  // Ask for one extra row to know whether there is another page.
  const { data, error } = await request
    .order("updated_at", { ascending: false })
    .limit(limit + 1)
    .overrideTypes<EntryRow[], { merge: false }>();
  if (error) throw new Error(`Could not load the shelf: ${error.message}`);

  const rows = data ?? [];
  return {
    items: rows.slice(0, limit).map((row) => ({ game: toGameSummary(row), entry: toEntry(row) })),
    hasMore: rows.length > limit,
  };
}

export async function getPlayerReviews(
  player: { id: string; username: string },
  viewerId?: string,
): Promise<PlayerReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select(ENTRY_COLUMNS)
    .eq("user_id", player.id)
    .not("review", "is", null)
    .order("created_at", { ascending: false })
    .overrideTypes<EntryRow[], { merge: false }>();
  if (error) throw new Error(`Could not load reviews: ${error.message}`);

  const rows = data ?? [];
  const liked = await likedEntryIds(rows.map((row) => row.id), viewerId);
  return rows.map((row) => ({ game: toGameSummary(row), review: toReview(row, liked, player.username) }));
}

/** One review by its shelf entry id, or null when the entry is gone or holds no review. */
export async function getReview(entryId: number, viewerId?: string): Promise<ReviewDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select(`${ENTRY_COLUMNS}, author:profiles!library_entries_user_id_fkey (id, username)`)
    .eq("id", entryId)
    .not("review", "is", null)
    .maybeSingle()
    .overrideTypes<(EntryRow & { author: { id: string; username: string } | null }) | null, { merge: false }>();
  if (error) throw new Error(`Could not load the review: ${error.message}`);
  if (!data?.author) return null;

  const liked = await likedEntryIds([data.id], viewerId);
  return {
    game: toGameSummary(data),
    review: { ...toReview(data, liked, data.author.username), author: data.author },
  };
}
