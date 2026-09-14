"use client";

import { useActionState } from "react";
import { addGameToList, type AddGameState } from "@/app/lists/actions";

type AddGameButtonProps = {
  listId: string;
  slug: string;
  title: string;
};

/** Adds one search result to the list being edited. */
export function AddGameButton({ listId, slug, title }: AddGameButtonProps) {
  const [state, formAction, pending] = useActionState<AddGameState, FormData>(addGameToList, null);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending || Boolean(state?.added)}
        aria-label={`Add ${title} to the list`}
        className="h-10 border-2 border-ink px-3.5 text-sm font-semibold uppercase hover:border-accent hover:text-accent disabled:opacity-60 disabled:hover:border-ink disabled:hover:text-ink"
      >
        {pending ? "Adding..." : state?.added ? "Added" : "+ Add"}
      </button>
      {state?.error && (
        <span role="alert" className="text-xs text-p1">
          {state.error}
        </span>
      )}
    </form>
  );
}
