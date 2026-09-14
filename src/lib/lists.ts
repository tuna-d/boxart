import { createClient } from "@/lib/supabase/server";
import type { ListChoice, ListDetail, ListEntry, ListSort, ListSummary } from "./types";

export const LIST_ITEM_LIMIT = 100;
const PREVIEW_SIZE = 5;

const LIST_COLUMNS =
  "id, user_id, title, description, ranked, items_count, likes_count, created_at, updated_at, " +
  "profiles!lists_user_id_fkey (username)";
const ITEM_COLUMNS = "id, game_id, game_slug, game_title, game_cover_url, game_release_date, position";

type ItemRow = {
  id: number;
  game_id: number;
  game_slug: string;
  game_title: string;
  game_cover_url: string | null;
  game_release_date: string | null;
  position: number;
};

type ListRow = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  ranked: boolean;
  items_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles: { username: string } | null;
  list_items: ItemRow[];
};

function toEntry(row: ItemRow): ListEntry {
  return {
    id: String(row.id),
    game: {
      id: String(row.game_id),
      slug: row.game_slug,
      title: row.game_title,
      coverUrl: row.game_cover_url,
      releaseDate: row.game_release_date,
    },
  };
}

function toSummary(row: ListRow, likedIds: Set<number>): ListSummary {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    ranked: row.ranked,
    author: { id: row.user_id, username: row.profiles?.username ?? "unknown" },
    itemsCount: row.items_count,
    likes: row.likes_count,
    likedByViewer: likedIds.has(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    previewGames: row.list_items.slice(0, PREVIEW_SIZE).map((item) => ({
      slug: item.game_slug,
      title: item.game_title,
      coverUrl: item.game_cover_url,
    })),
  };
}

/** Parses a list id from the URL, or returns null when it is not one. */
export function parseListId(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d{0,15}$/.test(value)) return null;
  return Number(value);
}

async function likedListIds(listIds: number[], viewerId: string | undefined) {
  if (!viewerId || listIds.length === 0) return new Set<number>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("list_likes")
    .select("list_id")
    .eq("user_id", viewerId)
    .in("list_id", listIds);
  return new Set((data ?? []).map((like) => like.list_id as number));
}

export async function getLists({
  sort = "popular",
  authorId,
  viewerId,
  limit = 48,
}: { sort?: ListSort; authorId?: string; viewerId?: string; limit?: number } = {}): Promise<ListSummary[]> {
  const supabase = await createClient();
  let request = supabase
    .from("lists")
    .select(`${LIST_COLUMNS}, list_items (${ITEM_COLUMNS})`)
    .order("position", { referencedTable: "list_items" })
    .limit(PREVIEW_SIZE, { referencedTable: "list_items" });

  if (authorId) {
    request = request.eq("user_id", authorId);
  } else {
    // Empty lists have nothing to show yet, so the public directory skips them.
    request = request.gt("items_count", 0);
  }
  if (sort === "popular") request = request.order("likes_count", { ascending: false });

  const { data, error } = await request
    .order("updated_at", { ascending: false })
    .limit(limit)
    .overrideTypes<ListRow[], { merge: false }>();
  if (error) throw new Error(`Could not load lists: ${error.message}`);

  const rows = data ?? [];
  const liked = await likedListIds(rows.map((row) => row.id), viewerId);
  return rows.map((row) => toSummary(row, liked));
}

export async function getList(id: number, viewerId?: string): Promise<ListDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select(`${LIST_COLUMNS}, list_items (${ITEM_COLUMNS})`)
    .eq("id", id)
    .order("position", { referencedTable: "list_items" })
    .order("id", { referencedTable: "list_items" })
    .maybeSingle()
    .overrideTypes<ListRow | null, { merge: false }>();
  if (error) throw new Error(`Could not load the list: ${error.message}`);
  if (!data) return null;

  const liked = await likedListIds([data.id], viewerId);
  return { ...toSummary(data, liked), entries: data.list_items.map(toEntry) };
}

export async function getListChoices(viewerId: string, gameId: string): Promise<ListChoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select("id, title, items_count")
    .eq("user_id", viewerId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load your lists: ${error.message}`);

  const lists = data ?? [];
  if (lists.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("list_items")
    .select("list_id")
    .eq("game_id", Number(gameId))
    .in(
      "list_id",
      lists.map((list) => list.id),
    );
  if (itemsError) throw new Error(`Could not load your lists: ${itemsError.message}`);

  const withGame = new Set((items ?? []).map((item) => item.list_id as number));
  return lists.map((list) => ({
    id: String(list.id),
    title: list.title,
    itemsCount: list.items_count,
    hasGame: withGame.has(list.id),
  }));
}
