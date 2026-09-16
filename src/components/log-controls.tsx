"use client";

import Link from "next/link";
import { useState } from "react";
import { LogDialog, logStatuses } from "@/components/log-dialog";
import type { Game, LibraryEntry, LibraryStatus } from "@/lib/types";

type LogControlsProps = {
  game: Pick<Game, "slug" | "title" | "platforms">;
  entry: LibraryEntry | null;
  signedIn: boolean;
  /** How many diary entries the player has for this game. */
  diaryCount?: number;
};

const statusClass = "flex h-11 items-center border-2 px-3.5 uppercase hover:border-accent hover:text-accent";
const startClass =
  "flex h-13 w-fit items-center px-5 font-pixel text-lg key-button";

export function LogControls({ game, entry, signedIn, diaryCount = 0 }: LogControlsProps) {
  const [dialogStatus, setDialogStatus] = useState<LibraryStatus | null>(null);

  if (!signedIn) {
    return (
      <>
        <div className="mt-3 flex flex-wrap gap-2.5 text-sm font-semibold uppercase">
          {logStatuses.map((status) => (
            <Link key={status.value} href="/sign-in" className={`${statusClass} border-ink`}>
              [ ] {status.label}
            </Link>
          ))}
        </div>
        <Link href="/sign-in" className={startClass}>
          Press start to log
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2.5 text-sm font-semibold uppercase">
        {logStatuses.map((status) => {
          const current = entry?.status === status.value;
          return (
            <button
              key={status.value}
              type="button"
              aria-haspopup="dialog"
              aria-pressed={current}
              onClick={() => setDialogStatus(status.value)}
              className={`${statusClass} ${current ? "border-accent text-accent" : "border-ink"}`}
            >
              [{current ? "x" : " "}] {status.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setDialogStatus(entry?.status ?? "played")}
        className={startClass}
      >
        {entry ? "Edit your log" : "Press start to log"}
      </button>

      {dialogStatus && (
        <LogDialog
          game={game}
          entry={entry}
          initialStatus={dialogStatus}
          diaryCount={diaryCount}
          onClose={() => setDialogStatus(null)}
        />
      )}
    </>
  );
}
