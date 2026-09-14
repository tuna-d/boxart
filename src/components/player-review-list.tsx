import Link from "next/link";
import { GameCover } from "@/components/game-cover";
import { HeartRating } from "@/components/heart-rating";
import { LikeButton } from "@/components/like-button";
import { formatDate, releaseYear } from "@/lib/format";
import type { PlayerReview } from "@/lib/types";

type PlayerReviewListProps = {
  reviews: PlayerReview[];
  signedIn: boolean;
  path: string;
};

export function PlayerReviewList({ reviews, signedIn, path }: PlayerReviewListProps) {
  if (reviews.length === 0) {
    return <p className="mt-5 text-ink-soft">No reviews yet.</p>;
  }

  return (
    <ul className="mt-5 border-t-2 border-dashed border-line">
      {reviews.map(({ game, review }) => {
        const href = `/games/${game.slug}`;
        return (
          <li key={review.id} className="flex gap-5 border-b-2 border-dashed border-line py-5">
            <Link href={href} tabIndex={-1} aria-hidden="true" className="w-14 shrink-0 pt-1 md:w-16">
              <GameCover title={game.title} imageUrl={game.coverUrl} size="xs" className="w-full" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Link href={href} className="font-pixel text-[17px] uppercase hover:text-accent">
                  {game.title}
                </Link>
                <span className="text-sm text-muted">{releaseYear(game.releaseDate)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                {review.rating !== null && <HeartRating value={review.rating} />}
                <span>
                  {review.platform}
                  {review.hoursPlayed !== null && ` · ${review.hoursPlayed}h`}
                </span>
                <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
              </div>
              <p className="max-w-3xl text-[15px] leading-relaxed text-pretty">{review.body}</p>
              <LikeButton
                kind="review"
                targetId={review.id}
                likes={review.likes}
                liked={review.likedByViewer}
                signedIn={signedIn}
                path={path}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
