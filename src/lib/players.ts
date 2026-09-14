import { createClient } from "@/lib/supabase/server";
import type { Player } from "./types";

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
