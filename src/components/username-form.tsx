"use client";

import { useActionState } from "react";
import { updateUsername, type UsernameState } from "@/app/settings/actions";
import { PlatformPicker } from "@/components/platform-picker";
import { TextField } from "@/components/text-field";

type UsernameFormProps = {
  currentUsername: string;
  isNew: boolean;
};

export function UsernameForm({ currentUsername, isNew }: UsernameFormProps) {
  const [state, formAction, pending] = useActionState<UsernameState, FormData>(updateUsername, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        id="username"
        name="username"
        label="Username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={20}
        pattern="[a-zA-Z0-9_.]+"
        defaultValue={state?.username ?? (isNew ? "" : currentUsername)}
        placeholder={isNew ? currentUsername : undefined}
        hint="3-20 characters: letters, numbers, dots and underscores."
      />

      {isNew && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span id="new-platforms" className="font-pixel text-sm text-ink-soft">
              Where do you play?
            </span>
            <span className="text-xs text-muted">Optional. Pick any, they show on your profile.</span>
          </div>
          <PlatformPicker selected={[]} labelledBy="new-platforms" />
        </div>
      )}

      {state?.error && (
        <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="border-2 border-dashed border-p2 p-3 text-sm text-p2">
          Saved. Your new name is on the scoreboard.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-13 font-pixel text-lg key-button key-button-cyan disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Saving..." : isNew ? "Start playing" : "Save username"}
      </button>
    </form>
  );
}
