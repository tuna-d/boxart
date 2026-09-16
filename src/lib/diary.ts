import { createClient } from "@/lib/supabase/server";
import { daysInMonth, monthKey, type CalendarMonth } from "./calendar";
import type { DiaryEntry, DiaryPlays } from "./types";

type DiaryRow = {
  id: number;
  game_id: number;
  game_slug: string;
  game_title: string;
  game_cover_url: string | null;
  game_release_date: string | null;
  played_on: string;
  replay: boolean;
  rating: number | null;
  note: string | null;
  created_at: string;
};

const DIARY_COLUMNS =
  "id, game_id, game_slug, game_title, game_cover_url, game_release_date, played_on, replay, rating, note, created_at";

function toDiaryEntry(row: DiaryRow): DiaryEntry {
  return {
    id: String(row.id),
    game: {
      id: String(row.game_id),
      slug: row.game_slug,
      title: row.game_title,
      coverUrl: row.game_cover_url,
      releaseDate: row.game_release_date,
    },
    playedOn: row.played_on,
    replay: row.replay,
    rating: row.rating === null ? null : Number(row.rating),
    note: row.note,
    createdAt: row.created_at,
  };
}

/** A player's diary entries for one month, latest day first. */
export async function getDiaryMonth(playerId: string, month: CalendarMonth): Promise<DiaryEntry[]> {
  const key = monthKey(month);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diary_entries")
    .select(DIARY_COLUMNS)
    .eq("user_id", playerId)
    .gte("played_on", `${key}-01`)
    .lte("played_on", `${key}-${String(daysInMonth(month)).padStart(2, "0")}`)
    .order("played_on", { ascending: false })
    .order("created_at", { ascending: false })
    .overrideTypes<DiaryRow[], { merge: false }>();
  if (error) throw new Error(`Could not load the diary: ${error.message}`);
  return (data ?? []).map(toDiaryEntry);
}

export async function getDiaryCount(playerId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("diary_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", playerId);
  if (error) throw new Error(`Could not load the diary count: ${error.message}`);
  return count ?? 0;
}

/** How many times a player logged a game in their diary and the latest day, or null when never. */
export async function getDiaryPlays(playerId: string, gameId: string): Promise<DiaryPlays | null> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("diary_entries")
    .select("played_on", { count: "exact" })
    .eq("user_id", playerId)
    .eq("game_id", Number(gameId))
    .order("played_on", { ascending: false })
    .limit(1)
    .overrideTypes<{ played_on: string }[], { merge: false }>();
  if (error) throw new Error(`Could not load your diary plays: ${error.message}`);
  const latest = data?.[0];
  return latest && count ? { count, lastPlayedOn: latest.played_on } : null;
}

/** A player's diary entries for one game, latest day first. */
export async function getGameDiaryEntries(playerId: string, gameSlug: string): Promise<DiaryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diary_entries")
    .select(DIARY_COLUMNS)
    .eq("user_id", playerId)
    .eq("game_slug", gameSlug)
    .order("played_on", { ascending: false })
    .order("created_at", { ascending: false })
    .overrideTypes<DiaryRow[], { merge: false }>();
  if (error) throw new Error(`Could not load your diary entries: ${error.message}`);
  return (data ?? []).map(toDiaryEntry);
}
