"use client";

import { useState } from "react";
import { deleteList } from "@/app/lists/actions";

/** Deleting takes two presses so a list is not lost to a stray click. */
export function DeleteListButton({ listId }: { listId: string }) {
  const [armed, setArmed] = useState(false);

  return (
    <form action={deleteList} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="listId" value={listId} />
      {armed ? (
        <>
          <button
            type="submit"
            className="h-12 bg-p1 px-5 font-pixel text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Yes, delete it
          </button>
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="h-12 px-3 text-sm font-semibold text-ink-soft uppercase hover:text-ink"
          >
            Keep it
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="h-12 px-1 text-sm font-semibold text-p1 uppercase hover:text-ink"
        >
          Delete this list
        </button>
      )}
    </form>
  );
}
