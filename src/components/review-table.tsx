import { HeartRating } from "@/components/heart-rating";
import type { Review } from "@/lib/types";

const rankColors = ["text-accent", "text-p2", "text-p1"];
const columns = "md:grid md:grid-cols-[90px_220px_120px_140px_minmax(0,1fr)] md:gap-4";

function ordinal(rank: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const lastTwo = rank % 100;
  return rank + (suffixes[(lastTwo - 20) % 10] ?? suffixes[lastTwo] ?? suffixes[0]);
}

export function ReviewTable({ reviews }: { reviews: Review[] }) {
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
                  <span className={`truncate font-pixel text-[17px] uppercase ${color}`}>
                    {review.author.username}
                  </span>
                  <span className="text-sm text-muted">
                    {review.platform}
                    {review.hoursPlayed !== null && ` · ${review.hoursPlayed}h`}
                  </span>
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className={`font-pixel text-lg ${color}`}>
                    {review.likes.toLocaleString("en-US")}
                  </span>
                  <span className="text-xs text-muted uppercase">likes</span>
                </span>
                <span className="md:pt-1">
                  <HeartRating value={review.rating} />
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
