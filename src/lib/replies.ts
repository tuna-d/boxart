import { createClient } from "@/lib/supabase/server";
import type { ReviewReply } from "./types";

export const REPLY_LIMIT = 1000;
const MAX_REPLIES = 500;

type ReplyRow = {
  id: number;
  body: string;
  created_at: string;
  author: { id: string; username: string } | null;
};

/** The replies on a review, oldest first so the thread reads top to bottom. */
export async function getReplies(entryId: number): Promise<ReviewReply[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_replies")
    .select("id, body, created_at, author:profiles!review_replies_user_id_fkey (id, username)")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: true })
    .limit(MAX_REPLIES)
    .overrideTypes<ReplyRow[], { merge: false }>();
  if (error) throw new Error(`Could not load replies: ${error.message}`);

  return (data ?? []).flatMap((row) =>
    row.author ? [{ id: String(row.id), author: row.author, body: row.body, createdAt: row.created_at }] : [],
  );
}
