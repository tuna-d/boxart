"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { cleanPlatforms, type PlatformId } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";

export type UsernameState = {
  error?: string;
  saved?: boolean;
  username?: string;
} | null;

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;

export async function updateUsername(_previous: UsernameState, formData: FormData): Promise<UsernameState> {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const value = formData.get("username");
  const username = typeof value === "string" ? value.trim() : "";
  const wasNew = player.needsUsername;
  // New players can pick platforms on the same step. Settings saves them with their own form.
  const platforms = wasNew ? cleanPlatforms(formData.getAll("platforms")) : null;

  if (!USERNAME_PATTERN.test(username)) {
    return { username, error: "Usernames are 3-20 letters, numbers, dots or underscores." };
  }
  if (username === player.username) {
    return wasNew
      ? { username, error: "Pick a name of your own instead of the placeholder." }
      : { username, saved: true };
  }

  const supabase = await createClient();
  const sameName = username.toLowerCase() === player.username?.toLowerCase();
  if (!sameName) {
    const { data: available, error } = await supabase.rpc("username_available", { name: username });
    if (error) {
      return { username, error: "Could not check that username. Try again in a moment." };
    }
    if (!available) {
      return { username, error: "That username is taken." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(platforms ? { username, platforms } : { username })
    .eq("id", player.id);
  if (error) {
    // Unique violation: someone took the name between the check and the update.
    if (error.code === "23505") {
      return { username, error: "That username is taken." };
    }
    return { username, error: "Could not save your username. Try again in a moment." };
  }

  revalidatePath("/", "layout");
  if (wasNew) redirect("/");
  return { username, saved: true };
}

export type BioState = {
  error?: string;
  saved?: boolean;
  bio?: string;
} | null;

const BIO_LIMIT = 280;

export async function updateBio(_previous: BioState, formData: FormData): Promise<BioState> {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const value = formData.get("bio");
  // Collapse runs of blank lines so a bio cannot push the profile apart.
  const bio = typeof value === "string" ? value.trim().replace(/\n{3,}/g, "\n\n") : "";
  if (bio.length > BIO_LIMIT) {
    return { bio, error: `Bios can be up to ${BIO_LIMIT} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ bio }).eq("id", player.id);
  if (error) {
    return { bio, error: "Could not save your bio. Try again in a moment." };
  }

  if (player.username) revalidatePath(`/players/${player.username}`);
  revalidatePath("/players");
  return { bio, saved: true };
}

export type PlatformsState = {
  error?: string;
  saved?: boolean;
  platforms?: PlatformId[];
} | null;

export async function updatePlatforms(_previous: PlatformsState, formData: FormData): Promise<PlatformsState> {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const platforms = cleanPlatforms(formData.getAll("platforms"));
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ platforms }).eq("id", player.id);
  if (error) {
    return { platforms, error: "Could not save your platforms. Try again in a moment." };
  }

  if (player.username) revalidatePath(`/players/${player.username}`);
  revalidatePath("/games", "layout");
  return { platforms, saved: true };
}
