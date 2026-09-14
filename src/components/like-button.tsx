"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toggleListLike } from "@/app/lists/actions";
import { toggleReviewLike } from "@/app/reviews/actions";
import { PixelHeart } from "@/components/heart-rating";

const targets = {
  review: { action: toggleReviewLike, noun: "review" },
  list: { action: toggleListLike, noun: "list" },
};

type LikeButtonProps = {
  /** What is being liked, which picks the action that saves it. */
  kind: keyof typeof targets;
  targetId: string;
  likes: number;
  liked: boolean;
  signedIn: boolean;
  /** The page to refresh after the like is saved. */
  path: string;
  colorClass?: string;
};

export function LikeButton({
  kind,
  targetId,
  likes,
  liked,
  signedIn,
  path,
  colorClass = "text-accent",
}: LikeButtonProps) {
  const [optimistic, setOptimistic] = useOptimistic({ likes, liked });
  const [, startTransition] = useTransition();
  const { action, noun } = targets[kind];
  const label = `${optimistic.likes.toLocaleString("en-US")} likes`;

  const content = (
    <>
      <span className="relative h-3.5 w-4">
        <PixelHeart className={optimistic.liked ? "text-p1" : "text-line group-hover:text-muted"} />
      </span>
      <span className={`font-pixel text-lg ${colorClass}`}>{optimistic.likes.toLocaleString("en-US")}</span>
      <span className="text-xs text-muted uppercase">likes</span>
    </>
  );

  if (!signedIn) {
    return (
      <Link href="/sign-in" aria-label={`${label}. Sign in to like`} className="group flex items-center gap-1.5">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={optimistic.liked}
      aria-label={`${label}. ${optimistic.liked ? "Remove your like" : `Like this ${noun}`}`}
      onClick={() =>
        startTransition(async () => {
          const wasLiked = optimistic.liked;
          setOptimistic({ likes: optimistic.likes + (wasLiked ? -1 : 1), liked: !wasLiked });
          const formData = new FormData();
          formData.set("id", targetId);
          formData.set("liked", String(wasLiked));
          formData.set("path", path);
          await action(formData);
        })
      }
      className="group flex items-center gap-1.5"
    >
      {content}
    </button>
  );
}
