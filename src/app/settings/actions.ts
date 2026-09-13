"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
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

  const { error } = await supabase.from("profiles").update({ username }).eq("id", player.id);
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
