import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteReply } from "@/app/reviews/actions";
import { GameCover } from "@/components/game-cover";
import { HeartRating } from "@/components/heart-rating";
import { LikeButton } from "@/components/like-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { ReplyForm } from "@/components/reply-form";
import { getCurrentPlayer } from "@/lib/auth";
import { formatDate, releaseYear, timeAgo } from "@/lib/format";
import { parseId } from "@/lib/ids";
import { getReview } from "@/lib/library";
import { getReplies } from "@/lib/replies";

export async function generateMetadata(props: PageProps<"/reviews/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const entryId = parseId(id);
  const detail = entryId ? await getReview(entryId) : null;
  if (!detail) return { title: "Review not found" };
  return {
    title: `${detail.review.author.username} on ${detail.game.title}`,
    description: detail.review.body.slice(0, 160),
  };
}

export default async function ReviewPage(props: PageProps<"/reviews/[id]">) {
  const { id } = await props.params;
  const entryId = parseId(id);
  if (!entryId) notFound();

  const viewer = await getCurrentPlayer();
  const [detail, replies] = await Promise.all([getReview(entryId, viewer?.id), getReplies(entryId)]);
  if (!detail) notFound();

  const { game, review } = detail;
  const path = `/reviews/${review.id}`;
  const gameHref = `/games/${game.slug}`;
  const authorHref = `/players/${encodeURIComponent(review.author.username)}`;
  const isReviewAuthor = viewer?.id === review.author.id;
  const details = [review.platform, review.hoursPlayed !== null && `${review.hoursPlayed}h`].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-10 pb-16">
      <article className="grid gap-8 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Link href={gameHref} tabIndex={-1} aria-hidden="true" className="w-28 sm:w-full">
          <GameCover title={game.title} imageUrl={game.coverUrl} size="sm" eager className="w-full" />
        </Link>

        <div className="flex min-w-0 flex-col gap-4">
          <span className="font-pixel text-sm text-p2">&gt; Review</span>
          <h1 className="font-pixel text-3xl leading-none font-bold text-balance uppercase [text-shadow:4px_4px_0_var(--color-shade)] md:text-4xl">
            <Link href={gameHref} className="hover:text-accent">
              {game.title}
            </Link>{" "}
            <span className="align-middle text-base font-normal text-muted [text-shadow:none]">
              {releaseYear(game.releaseDate)}
            </span>
          </h1>

          <Link href={authorHref} className="flex w-fit items-center gap-3 text-sm hover:text-accent">
            <PlayerAvatar username={review.author.username} />
            <span>
              <span className="text-muted">Review by </span>
              <span className="font-pixel">{review.author.username}</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {review.rating !== null && <HeartRating value={review.rating} />}
            {details.length > 0 && <span>{details.join(" · ")}</span>}
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
          </div>

          <p className="border-y-2 border-dashed border-line py-5 text-[17px] leading-relaxed whitespace-pre-line text-pretty">
            {review.body}
          </p>

          <LikeButton
            kind="review"
            targetId={review.id}
            likes={review.likes}
            liked={review.likedByViewer}
            signedIn={viewer !== null}
            path={path}
          />
        </div>
      </article>

      <section aria-labelledby="replies-heading" className="mt-14">
        <div className="flex items-baseline justify-between gap-2 border-b-2 border-dashed border-line pb-3">
          <h2 id="replies-heading" className="font-pixel text-xl">
            Replies
          </h2>
          <span className="font-pixel text-accent">{replies.length}</span>
        </div>

        {replies.length === 0 ? (
          <p className="py-6 text-ink-soft">No replies yet. Start the conversation.</p>
        ) : (
          <ol>
            {replies.map((reply) => {
              const replyAuthorHref = `/players/${encodeURIComponent(reply.author.username)}`;
              const canDelete = viewer !== null && (viewer.id === reply.author.id || isReviewAuthor);
              return (
                <li key={reply.id} className="flex gap-4 border-b-2 border-dashed border-line py-4">
                  <Link href={replyAuthorHref} tabIndex={-1} aria-hidden="true">
                    <PlayerAvatar username={reply.author.username} />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link href={replyAuthorHref} className="font-pixel break-all hover:text-accent">
                        {reply.author.username}
                      </Link>
                      {reply.author.id === review.author.id && (
                        <span className="text-[11px] text-p2 uppercase">Author</span>
                      )}
                      <time dateTime={reply.createdAt} className="text-xs text-muted" suppressHydrationWarning>
                        {timeAgo(reply.createdAt)}
                      </time>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line text-pretty break-words">{reply.body}</p>
                  </div>
                  {canDelete && (
                    <form action={deleteReply} className="shrink-0">
                      <input type="hidden" name="replyId" value={reply.id} />
                      <input type="hidden" name="entryId" value={review.id} />
                      <button
                        type="submit"
                        aria-label={`Delete the reply by ${reply.author.username}`}
                        className="flex h-8 min-w-8 items-center justify-center border-2 border-line px-1.5 font-pixel text-xs hover:border-p1 hover:text-p1"
                      >
                        X
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-8">
          {viewer ? (
            <ReplyForm entryId={review.id} />
          ) : (
            <p className="text-ink-soft">
              <Link href="/sign-in" className="font-pixel text-accent hover:text-ink">
                Sign in
              </Link>{" "}
              to reply to this review.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
