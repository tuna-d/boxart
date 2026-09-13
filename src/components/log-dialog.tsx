"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HeartRatingInput } from "@/components/heart-rating-input";
import { TextField } from "@/components/text-field";
import type { Game, LibraryStatus } from "@/lib/types";

export const logStatuses: { value: LibraryStatus; label: string }[] = [
  { value: "played", label: "Played" },
  { value: "playing", label: "Playing" },
  { value: "backlog", label: "Backlog" },
];

const REVIEW_LIMIT = 2000;
const fieldClass =
  "border-2 border-line bg-screen px-3 text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none";

type LogDialogProps = {
  game: Pick<Game, "title" | "platforms">;
  initialStatus: LibraryStatus;
  onClose: () => void;
};

export function LogDialog({ game, initialStatus, onClose }: LogDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState(initialStatus);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [notice, setNotice] = useState(false);
  const id = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Accounts are not connected yet, so saving only shows a notice for now.
  function save(event: React.FormEvent) {
    event.preventDefault();
    setNotice(true);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onKeyDown={(event) => {
        // Some embedded browsers skip the native Escape handling, so close it ourselves.
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          dialogRef.current?.close();
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(560px,calc(100%-2rem))] overflow-y-auto border-4 border-accent bg-screen text-ink backdrop:bg-screen/80"
    >
      <form onSubmit={save} className="flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-pixel text-sm text-p2">&gt; Log game</span>
            <h2 id={`${id}-title`} className="font-pixel text-2xl leading-none font-bold uppercase">
              {game.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
            className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-line font-pixel hover:border-p1 hover:text-p1"
          >
            X
          </button>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-pixel text-sm text-ink-soft">Status</legend>
          <div className="grid grid-cols-3 gap-2">
            {logStatuses.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className="peer sr-only"
                />
                <span className="flex h-11 cursor-pointer items-center justify-center border-2 border-ink text-sm font-semibold uppercase peer-checked:border-accent peer-checked:bg-accent peer-checked:text-screen peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-accent">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {status === "backlog" ? (
          <p className="text-sm text-muted">Backlog games wait on your shelf until you start them.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span id={`${id}-rating`} className="font-pixel text-sm text-ink-soft">
                  Rating
                </span>
                <span className="text-sm text-muted">{rating === 0 ? "No rating" : `${rating} / 5`}</span>
              </div>
              <HeartRatingInput value={rating} onChange={setRating} labelledBy={`${id}-rating`} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor={`${id}-platform`} className="font-pixel text-sm text-ink-soft">
                  Platform
                </label>
                <select id={`${id}-platform`} name="platform" className={`h-12 ${fieldClass}`}>
                  {game.platforms.map((platform) => (
                    <option key={platform}>{platform}</option>
                  ))}
                </select>
              </div>
              <TextField
                id={`${id}-hours`}
                name="hours"
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                label="Hours played"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor={`${id}-review`} className="font-pixel text-sm text-ink-soft">
                  Review
                </label>
                <span className="text-xs text-muted">
                  {review.length} / {REVIEW_LIMIT}
                </span>
              </div>
              <textarea
                id={`${id}-review`}
                name="review"
                rows={5}
                maxLength={REVIEW_LIMIT}
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder="What stuck with you?"
                className={`resize-y py-2 leading-relaxed ${fieldClass}`}
              />
            </div>
          </>
        )}

        {notice && (
          <p role="status" className="border-2 border-dashed border-accent p-3 text-sm text-accent">
            Accounts are not switched on yet, so this log was not saved.
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-12 px-4 text-sm font-semibold text-ink-soft uppercase hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-12 bg-p1 px-5 font-pixel text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Save to shelf
          </button>
        </div>
      </form>
    </dialog>
  );
}
