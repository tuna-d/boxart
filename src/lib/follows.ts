import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityItem,
  FollowCounts,
  FriendPlay,
  LibraryStatus,
  NotificationItem,
  PlayerLink,
  ShelfActivity,
} from "./types";

type ProfileEmbed = { id: string; username: string } | null;

/** Ids of everyone the viewer follows. Cached per request because several parts of a page ask. */
export const getFollowingIds = cache(async (viewerId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", viewerId);
  if (error) throw new Error(`Could not load who you follow: ${error.message}`);
  return (data ?? []).map((row) => row.followee_id as string);
});

export async function getFollowCounts(playerId: string): Promise<FollowCounts> {
  const supabase = await createClient();
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", playerId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", playerId),
  ]);
  if (followers.error || following.error) throw new Error("Could not load follow counts");
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function getFollowPlayers(
  playerId: string,
  direction: "followers" | "following",
): Promise<(PlayerLink & { bio: string })[]> {
  const supabase = await createClient();
  const isFollowers = direction === "followers";
  const { data, error } = await supabase
    .from("follows")
    .select(
      isFollowers
        ? "created_at, profile:profiles!follows_follower_id_fkey (id, username, bio)"
        : "created_at, profile:profiles!follows_followee_id_fkey (id, username, bio)",
    )
    .eq(isFollowers ? "followee_id" : "follower_id", playerId)
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<{ created_at: string; profile: (ProfileEmbed & { bio: string }) | null }[], { merge: false }>();
  if (error) throw new Error(`Could not load ${direction}: ${error.message}`);
  return (data ?? []).flatMap((row) => (row.profile ? [row.profile] : []));
}

type EntryActivityRow = {
  id: number;
  status: LibraryStatus;
  rating: number | null;
  review: string | null;
  updated_at: string;
  game_id: number;
  game_slug: string;
  game_title: string;
  game_cover_url: string | null;
  game_release_date: string | null;
  profile: ProfileEmbed;
};

type ListActivityRow = {
  id: number;
  title: string;
  items_count: number;
  created_at: string;
  profile: ProfileEmbed;
};

function shelfKind(row: EntryActivityRow): ShelfActivity["kind"] {
  if (row.review) return "reviewed";
  if (row.rating !== null) return "rated";
  return row.status;
}

/** The latest shelf moves and new lists from everyone the viewer follows, newest first. */
export async function getFriendActivity(viewerId: string, limit = 8): Promise<ActivityItem[]> {
  const followingIds = await getFollowingIds(viewerId);
  if (followingIds.length === 0) return [];

  const supabase = await createClient();
  const [entries, lists] = await Promise.all([
    supabase
      .from("library_entries")
      .select(
        "id, status, rating, review, updated_at, game_id, game_slug, game_title, game_cover_url, game_release_date, " +
          "profile:profiles!library_entries_user_id_fkey (id, username)",
      )
      .in("user_id", followingIds)
      .order("updated_at", { ascending: false })
      .limit(limit)
      .overrideTypes<EntryActivityRow[], { merge: false }>(),
    supabase
      .from("lists")
      .select("id, title, items_count, created_at, profile:profiles!lists_user_id_fkey (id, username)")
      .in("user_id", followingIds)
      .gt("items_count", 0)
      .order("created_at", { ascending: false })
      .limit(limit)
      .overrideTypes<ListActivityRow[], { merge: false }>(),
  ]);
  if (entries.error) throw new Error(`Could not load friends' activity: ${entries.error.message}`);
  if (lists.error) throw new Error(`Could not load friends' activity: ${lists.error.message}`);

  const shelfItems: ActivityItem[] = (entries.data ?? []).flatMap((row) =>
    row.profile
      ? [
          {
            kind: shelfKind(row),
            id: `entry-${row.id}`,
            player: row.profile,
            game: {
              id: String(row.game_id),
              slug: row.game_slug,
              title: row.game_title,
              coverUrl: row.game_cover_url,
              releaseDate: row.game_release_date,
            },
            rating: row.rating === null ? null : Number(row.rating),
            review: row.review,
            at: row.updated_at,
          },
        ]
      : [],
  );
  const listItems: ActivityItem[] = (lists.data ?? []).flatMap((row) =>
    row.profile
      ? [
          {
            kind: "list" as const,
            id: `list-${row.id}`,
            player: row.profile,
            list: { id: String(row.id), title: row.title, itemsCount: row.items_count },
            at: row.created_at,
          },
        ]
      : [],
  );

  return [...shelfItems, ...listItems].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** Players the viewer follows who have this game on their shelf. */
export async function getFriendsWhoPlayed(viewerId: string, gameId: string): Promise<FriendPlay[]> {
  const followingIds = await getFollowingIds(viewerId);
  if (followingIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_entries")
    .select("status, rating, profile:profiles!library_entries_user_id_fkey (id, username)")
    .eq("game_id", Number(gameId))
    .in("user_id", followingIds)
    .order("updated_at", { ascending: false })
    .overrideTypes<{ status: LibraryStatus; rating: number | null; profile: ProfileEmbed }[], { merge: false }>();
  if (error) throw new Error(`Could not load friends who played: ${error.message}`);

  return (data ?? []).flatMap((row) =>
    row.profile
      ? [{ player: row.profile, status: row.status, rating: row.rating === null ? null : Number(row.rating) }]
      : [],
  );
}

export async function getNotifications(
  viewerId: string,
  limit = 20,
): Promise<{ items: NotificationItem[]; unread: number }> {
  const supabase = await createClient();
  const [list, unread, followingIds] = await Promise.all([
    supabase
      .from("notifications")
      .select(
        "id, kind, created_at, read_at, actor:profiles!notifications_actor_id_fkey (id, username), " +
          "entry:library_entries!notifications_entry_id_fkey (id, game_title), " +
          "list:lists!notifications_list_id_fkey (id, title)",
      )
      .eq("recipient_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .overrideTypes<
        {
          id: number;
          kind: NotificationItem["kind"];
          created_at: string;
          read_at: string | null;
          actor: ProfileEmbed;
          entry: { id: number; game_title: string } | null;
          list: { id: number; title: string } | null;
        }[],
        { merge: false }
      >(),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", viewerId)
      .is("read_at", null),
    getFollowingIds(viewerId),
  ]);
  if (list.error) throw new Error(`Could not load notifications: ${list.error.message}`);

  const following = new Set(followingIds);
  return {
    unread: unread.count ?? 0,
    items: (list.data ?? []).flatMap((row): NotificationItem[] => {
      if (!row.actor) return [];
      const base = { id: String(row.id), actor: row.actor, createdAt: row.created_at, read: row.read_at !== null };
      if (row.kind === "reply" || row.kind === "review_like") {
        return row.entry
          ? [{ ...base, kind: row.kind, review: { id: String(row.entry.id), gameTitle: row.entry.game_title } }]
          : [];
      }
      if (row.kind === "list_like") {
        return row.list ? [{ ...base, kind: "list_like", list: { id: String(row.list.id), title: row.list.title } }] : [];
      }
      return [{ ...base, kind: "follow", followingBack: following.has(row.actor.id) }];
    }),
  };
}
