"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toggleFollow } from "@/app/follows/actions";

const sizes = {
  sm: "h-8 px-2.5 text-[11px]",
  md: "h-11 px-4 text-sm",
};

type FollowButtonProps = {
  targetId: string;
  username: string;
  following: boolean;
  signedIn: boolean;
  /** The page to refresh after the change is saved. */
  path: string;
  size?: keyof typeof sizes;
  /** Label for the not-yet-following state, such as "Follow back" in notifications. */
  followLabel?: string;
};

export function FollowButton({
  targetId,
  username,
  following,
  signedIn,
  path,
  size = "md",
  followLabel = "+ Follow",
}: FollowButtonProps) {
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(following);
  const [, startTransition] = useTransition();
  const base = `flex w-fit shrink-0 items-center justify-center font-pixel whitespace-nowrap uppercase ${sizes[size]}`;
  const followClass = `${base} bg-p2 text-screen shadow-[3px_3px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`;

  if (!signedIn) {
    return (
      <Link href="/sign-in" className={followClass}>
        {followLabel}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={optimisticFollowing}
      aria-label={optimisticFollowing ? `Unfollow ${username}` : `Follow ${username}`}
      onClick={() =>
        startTransition(async () => {
          const wasFollowing = optimisticFollowing;
          setOptimisticFollowing(!wasFollowing);
          const formData = new FormData();
          formData.set("id", targetId);
          formData.set("following", String(wasFollowing));
          formData.set("path", path);
          await toggleFollow(formData);
        })
      }
      className={
        optimisticFollowing
          ? `group ${base} border-2 border-line text-ink-soft hover:border-p1 hover:text-p1`
          : followClass
      }
    >
      {optimisticFollowing ? (
        <>
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        followLabel
      )}
    </button>
  );
}
