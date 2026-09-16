"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { removeLogEntry, saveLogEntry, type LogState } from "@/app/games/actions";
import { GameDiaryEntries } from "@/components/game-diary-entries";
import { HeartRatingInput } from "@/components/heart-rating-input";
import { PixelCheckbox } from "@/components/pixel-checkbox";
import { TextField } from "@/components/text-field";
import { DIARY_FIRST_DAY, DIARY_NOTE_LIMIT, localToday } from "@/lib/calendar";
import type { Game, LibraryEntry, LibraryStatus } from "@/lib/types";

export const logStatuses: { value: LibraryStatus; label: string }[] = [
  { value: "played", label: "Played" },
  { value: "playing", label: "Playing" },
  { value: "backlog", label: "Backlog" },
];

const REVIEW_LIMIT = 2000;
const fieldClass =
  "border-2 border-line bg-screen px-3 text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none";

type LogDialogProps = {
  game: Pick<Game, "slug" | "title" | "platforms">;
  entry: LibraryEntry | null;
  initialStatus: LibraryStatus;
  diaryCount?: number;
  defaultPlatform?: string | null;
  onClose: () => void;
};

export function LogDialog({ game, entry, initialStatus, diaryCount = 0, defaultPlatform = null, onClose }: LogDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState(initialStatus);
  const [rating, setRating] = useState(entry?.rating ?? 0);
  const [review, setReview] = useState(entry?.review ?? "");
  // New plays go in the diary by default. Editing a game already marked played or playing
  // starts unticked, so fixing a typo in a review does not log another play.
  const [addToDiary, setAddToDiary] = useState(!entry || entry.status === "backlog");
  // The dialog only renders after a click, so reading the browser's clock here is safe.
  const [today] = useState(() => localToday());
  // With diary entries to think about, removing asks first instead of acting on one click.
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  // Deleting diary days in the dialog lowers this, so removing the game stops asking about them.
  const [liveDiaryCount, setLiveDiaryCount] = useState(diaryCount);
  const [saveState, saveAction, saving] = useActionState<LogState, FormData>(saveLogEntry, null);
  const [removeState, removeAction, removing] = useActionState<LogState, FormData>(removeLogEntry, null);
  const id = useId();
  const busy = saving || removing;
  const error = saveState?.error ?? removeState?.error;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (saveState?.saved || removeState?.removed) dialogRef.current?.close();
  }, [saveState, removeState]);

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
      <form action={saveAction} className="flex flex-col gap-6 p-6">
        <input type="hidden" name="slug" value={game.slug} />
        <input type="hidden" name="rating" value={rating} />

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-pixel text-sm text-p2">&gt; {entry ? "Edit log" : "Log game"}</span>
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
                <select
                  id={`${id}-platform`}
                  name="platform"
                  defaultValue={entry ? (entry.platform ?? "") : (defaultPlatform ?? "")}
                  className={`h-12 ${fieldClass}`}
                >
                  <option value="">Not set</option>
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
                step={1}
                defaultValue={entry?.hoursPlayed ?? ""}
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

            <fieldset className="flex flex-col gap-4 border-t-2 border-dashed border-line pt-5">
              <legend className="sr-only">Diary</legend>
              <PixelCheckbox
                name="diary"
                checked={addToDiary}
                onChange={setAddToDiary}
                label="Add to diary"
                hint="Log the day you played it."
              />
              {addToDiary && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      id={`${id}-played-on`}
                      name="playedOn"
                      type="date"
                      required
                      min={DIARY_FIRST_DAY}
                      max={today}
                      defaultValue={today}
                      label="Played on"
                      className="[color-scheme:dark]"
                    />
                    <div className="flex items-end pb-3">
                      <PixelCheckbox name="replay" defaultChecked={false} label="I've played this before" />
                    </div>
                  </div>
                  <TextField
                    id={`${id}-diary-note`}
                    name="diaryNote"
                    maxLength={DIARY_NOTE_LIMIT}
                    label="Diary note"
                    hint={`Optional, up to ${DIARY_NOTE_LIMIT} characters.`}
                    placeholder="Beat the final boss at 2am"
                  />
                </>
              )}
            </fieldset>
          </>
        )}

        {diaryCount > 0 && <GameDiaryEntries slug={game.slug} onCountChange={setLiveDiaryCount} />}

        {error && (
          <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
            {error}
          </p>
        )}

        {entry && confirmingRemove && liveDiaryCount > 0 && (
          <div className="flex flex-col gap-4 border-2 border-dashed border-p1 p-4">
            <p className="font-pixel text-sm text-p1">Remove this game from your shelf?</p>
            <PixelCheckbox
              name="deleteDiary"
              defaultChecked
              label={`Also delete ${liveDiaryCount === 1 ? "its diary entry" : `its ${liveDiaryCount} diary entries`}`}
              hint="Untick to keep the days you played it in your diary."
            />
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingRemove(false)}
                className="h-11 px-3 text-sm font-semibold text-ink-soft uppercase hover:text-ink"
              >
                Keep it
              </button>
              <button
                type="submit"
                formAction={removeAction}
                formNoValidate
                disabled={busy}
                className="h-11 border-2 border-p1 px-4 text-sm font-semibold text-p1 uppercase hover:bg-p1 hover:text-screen disabled:opacity-60"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          {entry && liveDiaryCount > 0 && !confirmingRemove && (
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              className="mr-auto h-12 px-1 text-sm font-semibold text-p1 uppercase hover:text-ink"
            >
              Remove from shelf
            </button>
          )}
          {entry && liveDiaryCount === 0 && (
            <button
              type="submit"
              formAction={removeAction}
              formNoValidate
              disabled={busy}
              className="mr-auto h-12 px-1 text-sm font-semibold text-p1 uppercase hover:text-ink disabled:opacity-60"
            >
              {removing ? "Removing..." : "Remove from shelf"}
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-12 px-4 text-sm font-semibold text-ink-soft uppercase hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-12 px-5 font-pixel key-button disabled:cursor-wait disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save to shelf"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
