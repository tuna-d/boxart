"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { parseId } from "@/lib/ids";
import { REPLY_LIMIT } from "@/lib/replies";
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

export type ReplyState = {
  error?: string;
  saved?: boolean;
} | null;

function refreshReview(entryId: number) {
  revalidatePath(`/reviews/${entryId}`);
}

export async function addReply(_previous: ReplyState, formData: FormData): Promise<ReplyState> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sign in to reply to reviews." };

  const entryId = parseId(formData.get("entryId"));
  if (!entryId) return { error: "That review could not be found." };

  const body = formData.get("body");
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return { error: "Write something before you send it." };
  if (text.length > REPLY_LIMIT) return { error: `Replies can be up to ${REPLY_LIMIT} characters.` };

  const supabase = await createClient();
  const { error } = await supabase.from("review_replies").insert({ entry_id: entryId, body: text });
  if (error) {
    // Row level security refuses replies on entries that no longer hold a review.
    if (error.code === "42501") return { error: "This review is no longer open for replies." };
    return { error: "Could not send your reply. Try again in a moment." };
  }

  refreshReview(entryId);
  return { saved: true };
}

export async function deleteReply(formData: FormData) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const replyId = parseId(formData.get("replyId"));
  const entryId = parseId(formData.get("entryId"));
  if (!replyId || !entryId) return;

  // Row level security allows it for the reply's writer and the review's author only.
  const supabase = await createClient();
  await supabase.from("review_replies").delete().eq("id", replyId).eq("entry_id", entryId);
  refreshReview(entryId);
}
