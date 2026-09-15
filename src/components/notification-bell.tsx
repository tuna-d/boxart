"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { markNotificationsRead } from "@/app/follows/actions";
import { FollowButton } from "@/components/follow-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { timeAgo } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";

type NotificationBellProps = {
  items: NotificationItem[];
  unread: number;
};

export function NotificationBell({ items, unread }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  // The unread count the player last opened the panel with, so the badge clears right away.
  const [seenUnread, setSeenUnread] = useState(-1);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const id = useId();
  const unreadCount = seenUnread === unread ? 0 : unread;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle() {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      setSeenUnread(unread);
      startTransition(() => markNotificationsRead());
    }
  }

  return (
    <div ref={rootRef} className="relative flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : "Notifications"}
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center text-ink hover:text-accent"
      >
        <svg viewBox="0 0 11 11" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M4 0h3v1H4zM3 1h5v1H3zM2 2h7v5H2zM1 7h9v1H1zM0 8h11v1H0zM4 9h3v2H4z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-4 bg-p1 px-1 font-pixel text-[10px] leading-4 text-screen">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-label="Notifications"
          className="absolute top-full right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] border-2 border-accent bg-screen font-mono text-sm whitespace-normal normal-case shadow-[6px_6px_0_var(--color-shade)]"
        >
          <div className="flex items-baseline justify-between border-b-2 border-dashed border-line px-4 py-3">
            <span className="font-pixel text-[15px]">Notifications</span>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-accent uppercase hover:text-ink"
            >
              See all
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-5 text-ink-soft">No notifications yet. New followers and replies show up here.</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  path={pathname}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationRow({
  item,
  path,
  onNavigate,
}: {
  item: NotificationItem;
  path: string;
  onNavigate?: () => void;
}) {
  const profileHref = `/players/${encodeURIComponent(item.actor.username)}`;

  return (
    <li
      className={`flex items-center gap-3 border-b-2 border-dashed border-line px-4 py-3 last:border-b-0 ${
        item.read ? "" : "bg-accent/5"
      }`}
    >
      <Link href={profileHref} onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        <PlayerAvatar username={item.actor.username} />
      </Link>
      <p className="min-w-0 flex-1 leading-snug">
        {!item.read && <span className="mr-1.5 inline-block h-2 w-2 bg-p1 align-middle" aria-label="New" />}
        <Link href={profileHref} onClick={onNavigate} className="font-pixel break-all hover:text-accent">
          {item.actor.username}
        </Link>{" "}
        {item.kind === "reply" ? (
          <span className="text-ink-soft">
            replied to your review of{" "}
            <Link
              href={`/reviews/${item.review.id}`}
              onClick={onNavigate}
              className="font-semibold text-ink hover:text-accent hover:underline"
            >
              {item.review.gameTitle}
            </Link>
          </span>
        ) : (
          <span className="text-ink-soft">started following you</span>
        )}
        <br />
        <time dateTime={item.createdAt} className="text-xs text-muted" suppressHydrationWarning>
          {timeAgo(item.createdAt)}
        </time>
      </p>
      {item.kind === "follow" ? (
        <FollowButton
          targetId={item.actor.id}
          username={item.actor.username}
          following={item.followingBack}
          signedIn
          path={path}
          size="sm"
          followLabel="Follow back"
        />
      ) : (
        <Link
          href={`/reviews/${item.review.id}`}
          onClick={onNavigate}
          className="flex h-8 shrink-0 items-center border-2 border-line px-2.5 font-pixel text-[11px] whitespace-nowrap uppercase hover:border-accent hover:text-accent"
        >
          View
        </Link>
      )}
    </li>
  );
}
