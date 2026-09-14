import Link from "next/link";
import { HeartRating } from "@/components/heart-rating";
import { LikeButton } from "@/components/like-button";
import type { Review } from "@/lib/types";

const rankColors = ["text-accent", "text-p2", "text-p1"];
const columns = "md:grid md:grid-cols-[90px_220px_120px_140px_minmax(0,1fr)] md:gap-4";

function ordinal(rank: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const lastTwo = rank % 100;
  return rank + (suffixes[(lastTwo - 20) % 10] ?? suffixes[lastTwo] ?? suffixes[0]);
}

type ReviewTableProps = {
  reviews: Review[];
  signedIn: boolean;
  path: string;
};

export function ReviewTable({ reviews, signedIn, path }: ReviewTableProps) {
  return (
    <section aria-labelledby="reviews-heading" className="mt-14">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-heading" className="font-pixel text-xl">
          Top reviews
        </h2>
        <span className="text-sm text-muted uppercase">Ranked by likes</span>
      </div>
      <div
        aria-hidden="true"
        className={`hidden border-b-2 border-dashed border-line pb-2.5 font-pixel text-sm text-muted ${columns}`}
      >
        <span>Rank</span>
        <span>Player</span>
        <span>Score</span>
        <span>Rating</span>
        <span>Review</span>
      </div>

      {reviews.length === 0 ? (
        <p className="py-6 text-ink-soft">No reviews yet. Be player one.</p>
      ) : (
        <ol>
          {reviews.map((review, index) => {
            const color = rankColors[index] ?? "text-ink";
            return (
              <li
                key={review.id}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b-2 border-dashed border-line py-4 md:items-start ${columns}`}
              >
                <span className={`font-pixel text-xl ${color}`}>{ordinal(index + 1)}</span>
                <span className="flex min-w-0 flex-col gap-1">
                  <Link
                    href={`/players/${encodeURIComponent(review.author.username)}`}
                    className={`truncate font-pixel text-[17px] uppercase hover:text-ink hover:underline ${color}`}
                  >
                    {review.author.username}
                  </Link>
                  <span className="text-sm text-muted">
                    {review.platform}
                    {review.hoursPlayed !== null && ` · ${review.hoursPlayed}h`}
                  </span>
                </span>
                <LikeButton
                  kind="review"
                  targetId={review.id}
                  likes={review.likes}
                  liked={review.likedByViewer}
                  signedIn={signedIn}
                  path={path}
                  colorClass={color}
                />
                <span className="md:pt-1">
                  {review.rating !== null && <HeartRating value={review.rating} />}
                </span>
                <p className="basis-full text-[15px] leading-relaxed text-pretty">{review.body}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
