"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { parseId } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export async function deleteDiaryEntry(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const entryId = parseId(formData.get("entryId"));
  if (!entryId) return;

  // Row level security also keeps players to their own diary.
  const supabase = await createClient();
  await supabase.from("diary_entries").delete().eq("id", entryId).eq("user_id", player.id);

  if (player.username) {
    revalidatePath(`/players/${player.username}/diary`);
    revalidatePath(`/players/${player.username}`);
  }
  const slug = formData.get("slug");
  if (typeof slug === "string" && SLUG_PATTERN.test(slug)) revalidatePath(`/games/${slug}`);
}
