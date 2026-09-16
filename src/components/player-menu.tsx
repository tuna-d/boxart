"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { PlayerAvatar } from "@/components/player-avatar";

type PlayerMenuProps = {
  username: string | null;
  needsUsername: boolean;
};

/** The small screen account menu. Wide screens show the name and sign out button in the header row. */
export function PlayerMenu({ username, needsUsername }: PlayerMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

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

  const profileHref = !needsUsername && username ? `/players/${encodeURIComponent(username)}` : null;
  const linkClass = "flex h-11 items-center px-4 hover:bg-accent/10 hover:text-accent";

  return (
    <div ref={rootRef} className="relative flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label="Account menu"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center outline-offset-2 hover:opacity-80"
      >
        {username ? (
          <PlayerAvatar username={username} />
        ) : (
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center border-2 border-accent text-accent">
            ?
          </span>
        )}
      </button>

      {open && (
        <div
          id={`${id}-menu`}
          className="absolute top-full right-0 z-50 mt-3 w-56 border-2 border-accent bg-screen font-pixel text-sm uppercase shadow-[6px_6px_0_var(--color-shade)]"
        >
          <p className="truncate border-b-2 border-dashed border-line px-4 py-3 text-accent normal-case">
            {needsUsername ? "No name yet" : username}
          </p>
          <nav aria-label="Account" className="flex flex-col py-1" onClick={() => setOpen(false)}>
            {profileHref ? (
              <>
                <Link href={profileHref} className={linkClass}>
                  Your profile
                </Link>
                <Link href={`${profileHref}/diary`} className={linkClass}>
                  Diary
                </Link>
              </>
            ) : (
              <Link href="/settings" className={`${linkClass} text-p1`}>
                Enter name
              </Link>
            )}
            <Link href="/settings" className={linkClass}>
              Settings
            </Link>
          </nav>
          <form action={signOut} className="border-t-2 border-dashed border-line py-1">
            <button type="submit" className={`${linkClass} w-full text-p2 uppercase`}>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
