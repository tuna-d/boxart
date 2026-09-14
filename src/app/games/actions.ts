"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPlayer } from "@/lib/auth";
import { getGameBySlug } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
import type { Game, LibraryStatus } from "@/lib/types";

export type LogState = {
  error?: string;
  saved?: boolean;
  removed?: boolean;
} | null;

const STATUSES: LibraryStatus[] = ["played", "playing", "backlog"];
const REVIEW_LIMIT = 2000;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isStatus(value: string): value is LibraryStatus {
  return (STATUSES as string[]).includes(value);
}

function refreshPages(game: Pick<Game, "slug">, username: string | null) {
  revalidatePath(`/games/${game.slug}`);
  if (username) revalidatePath(`/players/${username}`);
}

export async function saveLogEntry(_previous: LogState, formData: FormData): Promise<LogState> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sign in to save games to your shelf." };

  // Read the game from IGDB on the server so the stored title and cover can be trusted.
  const game = await getGameBySlug(readText(formData, "slug"));
  if (!game) return { error: "That game could not be found." };

  const status = readText(formData, "status");
  if (!isStatus(status)) return { error: "Choose played, playing or backlog." };
  const isBacklog = status === "backlog";

  const rating = Number(readText(formData, "rating") || "0");
  if (!Number.isFinite(rating) || rating < 0 || rating > 5 || !Number.isInteger(rating * 2)) {
    return { error: "Ratings go from half a heart to five hearts." };
  }

  const platform = readText(formData, "platform");
  if (platform && !game.platforms.includes(platform)) {
    return { error: "Pick one of the platforms in the list." };
  }

  const hoursText = readText(formData, "hours");
  const hours = hoursText === "" ? null : Number(hoursText);
  if (hours !== null && (!Number.isInteger(hours) || hours < 0 || hours > 9999)) {
    return { error: "Hours played must be a whole number up to 9999." };
  }

  const review = readText(formData, "review");
  if (review.length > REVIEW_LIMIT) {
    return { error: `Reviews can be up to ${REVIEW_LIMIT} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("library_entries").upsert(
    {
      game_id: Number(game.id),
      game_slug: game.slug,
      game_title: game.title,
      game_cover_url: game.coverUrl,
      game_release_date: game.releaseDate,
      status,
      rating: isBacklog || rating === 0 ? null : rating,
      platform: isBacklog || !platform ? null : platform,
      hours_played: isBacklog ? null : hours,
      review: isBacklog || !review ? null : review,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,game_id" },
  );
  if (error) {
    return { error: "Could not save to your shelf. Try again in a moment." };
  }

  refreshPages(game, player.username);
  return { saved: true };
}

export async function removeLogEntry(_previous: LogState, formData: FormData): Promise<LogState> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sign in to change your shelf." };

  const game = await getGameBySlug(readText(formData, "slug"));
  if (!game) return { error: "That game could not be found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("library_entries")
    .delete()
    .eq("user_id", player.id)
    .eq("game_id", Number(game.id));
  if (error) {
    return { error: "Could not remove it from your shelf. Try again in a moment." };
  }

  refreshPages(game, player.username);
  return { removed: true };
}
