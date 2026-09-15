import { createClient } from "@/lib/supabase/server";
import type { Player, PlayerListItem, PlayerSort } from "./types";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;

export async function getPlayer(username: string): Promise<Player | null> {
  if (!USERNAME_PATTERN.test(username)) return null;

  // Usernames are unique regardless of case. Escape the LIKE wildcard so "a_b" matches only itself.
  const pattern = username.replace(/_/g, "\\_");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, created_at")
    .ilike("username", pattern)
    .maybeSingle();
  if (error) throw new Error(`Could not load the player: ${error.message}`);
  if (!data) return null;

  return { id: data.id, username: data.username, bio: data.bio, joinedAt: data.created_at };
}

type PlayerRow = {
  id: string;
  username: string;
  bio: string;
  created_at: string;
  games_count: number;
  reviews_count: number;
  likes_received: number;
  last_active_at: string | null;
  recent_games: PlayerListItem["recentGames"];
};

export async function listPlayers({
  sort = "active",
  query,
  onlyIds,
}: { sort?: PlayerSort; query?: string; onlyIds?: string[] } = {}): Promise<PlayerListItem[]> {
  if (onlyIds && onlyIds.length === 0) return [];
  // Usernames only use letters, numbers, dots and underscores, so drop anything else before matching.
  const name = query?.replace(/[^a-zA-Z0-9_.]/g, "").replace(/_/g, "\\_") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_players", {
    sort_by: sort,
    name_query: name || null,
    only_ids: onlyIds ?? null,
  });
  if (error) throw new Error(`Could not load players: ${error.message}`);

  return ((data ?? []) as PlayerRow[]).map((row) => ({
    player: { id: row.id, username: row.username, bio: row.bio, joinedAt: row.created_at },
    gamesCount: Number(row.games_count),
    reviewsCount: Number(row.reviews_count),
    likesReceived: Number(row.likes_received),
    lastActiveAt: row.last_active_at,
    recentGames: row.recent_games,
  }));
}
