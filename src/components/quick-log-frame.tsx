"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { loadLogGame, setShelfStatus } from "@/app/games/actions";
import { LogDialog, logStatuses } from "@/components/log-dialog";
import { useViewerGameStates } from "@/components/viewer-game-states";
import { defaultGamePlatform } from "@/lib/platforms";
import type { Game, LibraryStatus } from "@/lib/types";

/** How long a finger has to rest on a cover before the quick log buttons open. */
const LONG_PRESS_MS = 450;

const statusBadges: Record<LibraryStatus, string> = {
  played: "bg-accent text-screen",
  playing: "bg-p2 text-screen",
  backlog: "bg-ink text-screen",
};

type FrameGame = Pick<Game, "id" | "slug" | "title"> & {
  /** Covers that already know the platforms open the log dialog without another request. */
  platforms?: string[];
};

type QuickLogFrameProps = {
  game: FrameGame;
  /** Name the viewer's shelf on the cover. Off where the card already shows someone's shelf. */
  showBadge?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps a game card whose cover sits at the top, and adds shelf buttons over the cover for the
 * signed-in player: on hover, from the corner button on touch screens or with a long press.
 * Needs a ViewerGameStatesProvider above it, otherwise it only renders the card.
 */
export function QuickLogFrame({ className = "", children, ...props }: QuickLogFrameProps) {
  const context = useViewerGameStates();
  if (!context?.signedIn) return <div className={`group relative ${className}`}>{children}</div>;
  return (
    <ActiveFrame className={className} {...props}>
      {children}
    </ActiveFrame>
  );
}

function ActiveFrame({ game, showBadge = true, className, children }: QuickLogFrameProps) {
  const context = useViewerGameStates()!;
  const state = context.states[game.id];
  const entry = state?.entry ?? null;
  const [open, setOpen] = useState(false);
  const [dialogGame, setDialogGame] = useState<Pick<Game, "slug" | "title" | "platforms"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [opening, startOpening] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);

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
    context.setState(game.id, {
      ...previous,
      entry: previous.entry
        ? { ...previous.entry, status }
        : { id: "", status, rating: null, platform: null, hoursPlayed: null, review: null, updatedAt: "" },
    });
    setError(null);
    startSaving(async () => {
      const result = await setShelfStatus(game.slug, status);
      if ("error" in result) {
        context.setState(game.id, previous);
        setError(result.error);
        setOpen(true);
      } else {
        context.setState(game.id, { ...previous, entry: result.entry });
        setOpen(false);
      }
    });
  }

  function openDialog() {
    setError(null);
    if (game.platforms) {
      setOpen(false);
      setDialogGame({ slug: game.slug, title: game.title, platforms: game.platforms });
      return;
    }
    startOpening(async () => {
      const loaded = await loadLogGame(game.slug).catch(() => null);
      if (!loaded) {
        setError("Could not open the log. Try again in a moment.");
        return;
      }
      setOpen(false);
      setDialogGame(loaded);
    });
  }

  const overlayVisible = open
    ? "pointer-events-auto opacity-100"
    : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100";
  const busy = saving || opening;

  return (
    <div
      ref={rootRef}
      className={`group relative ${className}`}
      onPointerDown={(event) => {
        longPressed.current = false;
        // Presses inside the open log dialog belong to the dialog.
        if (event.pointerType !== "touch" || dialogGame) return;
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
      onClickCapture={(event) => {
        // The finger lifting after a long press should not also follow the card's link.
        if (longPressed.current) {
          event.preventDefault();
          event.stopPropagation();
          longPressed.current = false;
        }
      }}
      onContextMenuCapture={(event) => {
        if (longPressed.current) event.preventDefault();
      }}
    >
      <div className="select-none [-webkit-touch-callout:none]">{children}</div>

      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] transition-transform group-hover:-translate-y-1">
        {showBadge && entry && (
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
            // With a mouse the buttons show on hover, so the corner button is only for touch and keyboards.
            open ? "border-accent text-accent opacity-100" : "opacity-0 [@media(hover:hover)]:pointer-events-none"
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
                disabled={busy}
                onClick={() => chooseStatus(option.value)}
                className={`flex h-8 items-center justify-center border-2 px-1 font-pixel text-[10px] uppercase disabled:cursor-wait ${
                  current ? "border-accent bg-accent text-screen" : "border-ink bg-screen hover:border-accent hover:text-accent"
                }`}
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            disabled={state === undefined || busy}
            onClick={openDialog}
            className="flex h-8 items-center justify-center gap-1 border-2 border-p2 bg-screen px-1 font-pixel text-[10px] whitespace-nowrap text-p2 uppercase hover:bg-p2 hover:text-screen disabled:opacity-60"
          >
            {opening ? (
              "..."
            ) : entry?.id ? (
              "Edit log"
            ) : (
              <>
                <svg viewBox="0 0 7 6" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" className="h-2.5 w-3">
                  <path d="M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z" />
                </svg>
                Rate
              </>
            )}
          </button>
        </div>
      </div>

      {dialogGame && (
        <LogDialog
          game={dialogGame}
          entry={entry?.id ? entry : null}
          initialStatus={entry?.status ?? "played"}
          diaryCount={state?.diaryCount ?? 0}
          defaultPlatform={defaultGamePlatform(dialogGame.platforms, context.playerPlatforms)}
          onClose={() => {
            setDialogGame(null);
            context.reload(game.id);
          }}
        />
      )}
    </div>
  );
}
