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
} from "./types";

const ENTRY_COLUMNS =
  "id, status, rating, platform, hours_played, review, likes_count, created_at, updated_at, " +
  "game_id, game_slug, game_title, game_cover_url, game_release_date";

type EntryRow = {
  id: number;
  status: LibraryStatus;
  rating: number | null;
  platform: string | null;
  hours_played: number | null;
  review: string | null;
  likes_count: number;
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
    .select(`${ENTRY_COLUMNS}, profiles (username)`)
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

export async function getPlayerLibrary(playerId: string): Promise<LibraryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select(ENTRY_COLUMNS)
    .eq("user_id", playerId)
    .order("updated_at", { ascending: false })
    .overrideTypes<EntryRow[], { merge: false }>();
  if (error) throw new Error(`Could not load the shelf: ${error.message}`);
  return (data ?? []).map((row) => ({ game: toGameSummary(row), entry: toEntry(row) }));
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

export function countByStatus(library: LibraryItem[]): Record<LibraryStatus, number> {
  const counts: Record<LibraryStatus, number> = { played: 0, playing: 0, backlog: 0 };
  for (const { entry } of library) counts[entry.status] += 1;
  return counts;
}
