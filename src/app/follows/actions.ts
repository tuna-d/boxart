"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function toggleFollow(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const targetId = formData.get("id");
  const following = formData.get("following") === "true";
  const path = formData.get("path");
  if (typeof targetId !== "string" || !UUID_PATTERN.test(targetId) || targetId === player.id) return;

  const supabase = await createClient();
  if (following) {
    await supabase.from("follows").delete().eq("follower_id", player.id).eq("followee_id", targetId);
  } else {
    // Following someone twice hits the primary key and is ignored.
    await supabase.from("follows").insert({ followee_id: targetId });
  }

  revalidatePath("/");
  revalidatePath("/players");
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
}

export async function markNotificationsRead() {
  const player = await getCurrentPlayer();
  if (!player) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", player.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}
