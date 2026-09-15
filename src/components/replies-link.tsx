import Link from "next/link";

/** "N replies", linking to the review page where the thread lives. */
export function RepliesLink({ reviewId, replies }: { reviewId: string; replies: number }) {
  return (
    <Link href={`/reviews/${reviewId}`} className="group flex w-fit items-center gap-1.5">
      <span className="font-pixel text-lg text-p2 group-hover:text-ink">{replies.toLocaleString("en-US")}</span>
      <span className="text-xs text-muted uppercase group-hover:text-ink">{replies === 1 ? "reply" : "replies"}</span>
    </Link>
  );
}
