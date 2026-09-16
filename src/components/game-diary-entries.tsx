"use client";

import { useEffect, useState, useTransition } from "react";
import { loadMyDiaryForGame, removeDiaryEntry } from "@/app/games/actions";
import { formatDate } from "@/lib/format";
import type { DiaryEntry } from "@/lib/types";

type GameDiaryEntriesProps = {
  slug: string;
  onCountChange: (count: number) => void;
};

/** The player's diary days for one game inside the log dialog, each removable without touching the shelf. */
export function GameDiaryEntries({ slug, onCountChange }: GameDiaryEntriesProps) {
  const [entries, setEntries] = useState<DiaryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  // The entry waiting for a second click to confirm, and the one being deleted.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    loadMyDiaryForGame(slug)
      .then((result) => {
        if (!live || !result) return;
        setEntries(result);
        onCountChange(result.length);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [slug, onCountChange]);

  function remove(entry: DiaryEntry) {
    if (confirming !== entry.id) {
      setConfirming(entry.id);
      return;
    }
    setConfirming(null);
    setDeleting(entry.id);
    setError(null);
    startTransition(async () => {
      const result = await removeDiaryEntry(entry.id, slug);
      setDeleting(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const next = (entries ?? []).filter((item) => item.id !== entry.id);
      setEntries(next);
      onCountChange(next.length);
    });
  }

  return (
    <section aria-labelledby={`diary-${slug}`} className="flex flex-col gap-3 border-t-2 border-dashed border-line pt-5">
      <div className="flex flex-col gap-1">
        <h3 id={`diary-${slug}`} className="font-pixel text-sm text-ink-soft">
          In your diary
        </h3>
        <p className="text-xs text-muted">Deleting a day here keeps the game on your shelf.</p>
      </div>

      {failed ? (
        <p className="text-sm text-p1">Could not load your diary entries. Close and open the log to try again.</p>
      ) : entries === null ? (
        <p className="text-sm text-muted">Loading your diary...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">No diary entries left for this game.</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => {
            const isConfirming = confirming === entry.id;
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 border-b-2 border-dashed border-line py-2.5 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={entry.playedOn} className="font-pixel text-sm text-accent">
                      {formatDate(entry.playedOn)}
                    </time>
                    {entry.replay && (
                      <span className="border-2 border-p2 px-1.5 font-pixel text-[10px] leading-4 text-p2 uppercase">
                        Replay
                      </span>
                    )}
                  </div>
                  {entry.note && <p className="truncate text-xs text-ink-soft">{entry.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  onBlur={() => isConfirming && setConfirming(null)}
                  disabled={deleting !== null}
                  aria-label={
                    isConfirming
                      ? `Confirm deleting the diary entry from ${formatDate(entry.playedOn)}`
                      : `Delete the diary entry from ${formatDate(entry.playedOn)}`
                  }
                  className={`h-9 shrink-0 border-2 px-3 text-xs font-semibold uppercase disabled:opacity-60 ${
                    isConfirming
                      ? "border-p1 bg-p1 text-screen"
                      : "border-line text-ink-soft hover:border-p1 hover:text-p1"
                  }`}
                >
                  {deleting === entry.id ? "Deleting..." : isConfirming ? "Sure? Delete" : "Delete"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-p1">
          {error}
        </p>
      )}
    </section>
  );
}
