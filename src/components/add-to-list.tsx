"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addGameToList, type AddGameState } from "@/app/lists/actions";
import type { ListChoice } from "@/lib/types";

type AddToListProps = {
  slug: string;
  lists: ListChoice[];
};

/** Adds the game on a game page to one of the viewer's lists. */
export function AddToList({ slug, lists }: AddToListProps) {
  const [state, formAction, pending] = useActionState<AddGameState, FormData>(addGameToList, null);
  const choices = lists.filter((list) => !list.hasGame);

  if (lists.length === 0) {
    return (
      <p className="text-sm text-muted">
        Collect games in a list.{" "}
        <Link href="/lists/new" className="text-accent uppercase hover:text-ink">
          Start a list
        </Link>
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="add-to-list" className="font-pixel text-sm text-ink-soft">
          Add to list
        </label>
        {choices.length === 0 ? (
          <span className="text-sm text-muted">This game is on all of your lists.</span>
        ) : (
          <>
            <select
              id="add-to-list"
              name="listId"
              className="h-10 max-w-60 min-w-0 border-2 border-line bg-screen px-2 text-sm text-ink hover:border-muted focus:border-accent focus-visible:outline-none"
            >
              {choices.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending}
              className="h-10 border-2 border-ink px-3.5 text-sm font-semibold uppercase hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Adding..." : "Add"}
            </button>
          </>
        )}
      </div>
      <p aria-live="polite" className="text-xs">
        {state?.error && <span className="text-p1">{state.error}</span>}
        {state?.added && <span className="text-p2">Added to {state.added}.</span>}
      </p>
    </form>
  );
}
