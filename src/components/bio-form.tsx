"use client";

import { useActionState, useState } from "react";
import { updateBio, type BioState } from "@/app/settings/actions";

const BIO_LIMIT = 280;

export function BioForm({ currentBio }: { currentBio: string }) {
  const [state, formAction, pending] = useActionState<BioState, FormData>(updateBio, null);
  const [bio, setBio] = useState(currentBio);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="font-pixel text-sm text-ink-soft">
            Bio
          </label>
          <span className="text-xs text-muted">
            {bio.length} / {BIO_LIMIT}
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={BIO_LIMIT}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Favourite genres, the game you always come back to, your current grind."
          className="resize-y border-2 border-line bg-transparent px-3 py-2 leading-relaxed text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none"
        />
      </div>

      {state?.error && (
        <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="border-2 border-dashed border-p2 p-3 text-sm text-p2">
          Saved. Your profile is up to date.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-13 border-2 border-ink font-pixel text-lg hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save bio"}
      </button>
    </form>
  );
}
