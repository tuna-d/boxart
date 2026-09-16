"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { setShelfStatus } from "@/app/games/actions";
import { GameCover } from "@/components/game-cover";
import { LogDialog, logStatuses } from "@/components/log-dialog";
import { releaseYear } from "@/lib/format";
import type { ViewerGameState } from "@/lib/library";
import type { GameListItem, LibraryStatus } from "@/lib/types";

/** How long a finger has to rest on a cover before the quick log buttons open. */
const LONG_PRESS_MS = 450;

const statusBadges: Record<LibraryStatus, string> = {
  played: "bg-accent text-screen",
  playing: "bg-p2 text-screen",
  backlog: "bg-ink text-screen",
};

type QuickLogCardProps = GameListItem & {
  signedIn: boolean;
  /** Undefined while the player's shelf entry is still loading. */
  state: ViewerGameState | undefined;
  onStateChange: (gameId: string, state: ViewerGameState) => void;
  onDialogClose: (gameId: string) => void;
};

/** A game card with shelf buttons over the cover: on hover, from the corner button or with a long press. */
export function QuickLogCard({ game, stats, signedIn, state, onStateChange, onDialogClose }: QuickLogCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);
  const entry = state?.entry ?? null;
  const href = `/games/${game.slug}`;

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

  useEffect(() => () => window.clearTimeout(pressTimer.current), []);

  function cancelPress() {
    window.clearTimeout(pressTimer.current);
  }

  function chooseStatus(status: LibraryStatus) {
    if (entry?.status === status) {
      setOpen(false);
      return;
    }
    const previous = state ?? { entry: null, diaryCount: 0 };
    // Show the new shelf right away. The saved entry replaces this once the server answers.
    onStateChange(game.id, {
      ...previous,
      entry: previous.entry
        ? { ...previous.entry, status }
        : { id: "", status, rating: null, platform: null, hoursPlayed: null, review: null, updatedAt: "" },
    });
    setError(null);
    startSaving(async () => {
      const result = await setShelfStatus(game.slug, status);
      if ("error" in result) {
        onStateChange(game.id, previous);
        setError(result.error);
        setOpen(true);
      } else {
        onStateChange(game.id, { ...previous, entry: result.entry });
        setOpen(false);
      }
    });
  }

  const overlayVisible = open
    ? "pointer-events-auto opacity-100"
    : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100";

  return (
    <div
      ref={rootRef}
      className="group relative"
      onPointerDown={(event) => {
        longPressed.current = false;
        if (!signedIn || event.pointerType !== "touch") return;
        pressTimer.current = window.setTimeout(() => {
          longPressed.current = true;
          setOpen(true);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={cancelPress}
      onPointerMove={(event) => {
        // A scroll gesture is not a press.
        if (event.pointerType === "touch" && (Math.abs(event.movementX) > 4 || Math.abs(event.movementY) > 4)) {
          cancelPress();
        }
      }}
      onPointerCancel={cancelPress}
    >
      <Link
        href={href}
        draggable={false}
        onClick={(event) => {
          // The finger lifting after a long press should not also open the game.
          if (longPressed.current) event.preventDefault();
        }}
        onContextMenu={(event) => {
          if (longPressed.current) event.preventDefault();
        }}
        className="flex flex-col gap-4 select-none [-webkit-touch-callout:none]"
      >
        <GameCover
          title={game.title}
          imageUrl={game.coverUrl}
          size="sm"
          className="w-full transition-transform group-hover:-translate-y-1"
        />
        <span className="flex flex-col gap-1.5">
          <span className="font-pixel text-sm leading-tight uppercase group-hover:text-accent">{game.title}</span>
          <span className="flex items-baseline justify-between text-xs text-muted">
            <span>{releaseYear(game.releaseDate)}</span>
            {stats.count > 0 && <span className="font-pixel text-sm text-accent">{stats.average.toFixed(1)}</span>}
          </span>
        </span>
      </Link>

      {signedIn && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] transition-transform group-hover:-translate-y-1">
          {entry && (
            <span
              className={`absolute top-2 left-2 px-1.5 py-0.5 font-pixel text-[10px] uppercase shadow-[2px_2px_0_var(--color-shade)] ${statusBadges[entry.status]}`}
            >
              {entry.status}
            </span>
          )}

          <button
            type="button"
            aria-expanded={open}
            aria-label={`Quick log ${game.title}`}
            onClick={() => setOpen(!open)}
            className={`pointer-events-auto absolute top-2 right-2 flex h-8 w-8 items-center justify-center border-2 border-ink bg-screen/90 font-pixel text-lg leading-none hover:border-accent hover:text-accent focus-visible:opacity-100 [@media(hover:none)]:opacity-100 ${
              open ? "border-accent text-accent opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {open ? "x" : "+"}
          </button>

          <div
            role="group"
            aria-label={`Shelf for ${game.title}`}
            className={`absolute inset-x-0 bottom-0 grid grid-cols-2 gap-1.5 bg-linear-to-t from-screen via-screen/85 to-transparent p-2 pt-8 transition-opacity ${overlayVisible}`}
          >
            {error && <p className="col-span-2 bg-screen text-[11px] leading-tight text-p1">{error}</p>}
            {logStatuses.map((option) => {
              const current = entry?.status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  aria-pressed={current}
                  disabled={saving}
                  onClick={() => chooseStatus(option.value)}
                  className={`flex h-8 items-center justify-center border-2 px-1 font-pixel text-[10px] uppercase disabled:cursor-wait ${
                    current
                      ? "border-accent bg-accent text-screen"
                      : "border-ink bg-screen hover:border-accent hover:text-accent"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              disabled={state === undefined || saving}
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
              className="flex h-8 items-center justify-center gap-1 border-2 border-p2 bg-screen px-1 font-pixel text-[10px] text-p2 uppercase hover:bg-p2 hover:text-screen disabled:opacity-60"
            >
              <svg viewBox="0 0 7 6" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" className="h-2.5 w-3">
                <path d="M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z" />
              </svg>
              {entry?.rating ? entry.rating : "Rate"}
            </button>
          </div>
        </div>
      )}

      {dialogOpen && (
        <LogDialog
          game={{ slug: game.slug, title: game.title, platforms: game.platforms }}
          entry={entry?.id ? entry : null}
          initialStatus={entry?.status ?? "played"}
          diaryCount={state?.diaryCount ?? 0}
          onClose={() => {
            setDialogOpen(false);
            onDialogClose(game.id);
          }}
        />
      )}
    </div>
  );
}
