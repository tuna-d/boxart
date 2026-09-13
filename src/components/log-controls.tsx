"use client";

import { useState } from "react";
import { LogDialog, logStatuses } from "@/components/log-dialog";
import type { Game, LibraryStatus } from "@/lib/types";

export function LogControls({ game }: { game: Pick<Game, "title" | "platforms"> }) {
  const [dialogStatus, setDialogStatus] = useState<LibraryStatus | null>(null);

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2.5 text-sm font-semibold uppercase">
        {logStatuses.map((status) => (
          <button
            key={status.value}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setDialogStatus(status.value)}
            className="flex h-11 items-center border-2 border-ink px-3.5 uppercase hover:border-accent hover:text-accent"
          >
            [ ] {status.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setDialogStatus("played")}
        className="flex h-13 w-fit items-center bg-p1 px-5 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        Press start to log
      </button>

      {dialogStatus && (
        <LogDialog game={game} initialStatus={dialogStatus} onClose={() => setDialogStatus(null)} />
      )}
    </>
  );
}
