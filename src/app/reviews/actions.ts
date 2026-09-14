"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function toggleReviewLike(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const entryId = Number(formData.get("id"));
  const liked = formData.get("liked") === "true";
  const path = formData.get("path");
  if (!Number.isInteger(entryId) || entryId <= 0) return;

  const supabase = await createClient();
  if (liked) {
    await supabase.from("review_likes").delete().eq("entry_id", entryId).eq("user_id", player.id);
  } else {
    // A repeated like hits the primary key and is ignored.
    await supabase.from("review_likes").insert({ entry_id: entryId });
  }

  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
}
