"use client";

import { useActionState } from "react";
import { updateUsername, type UsernameState } from "@/app/settings/actions";
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
        className="mt-2 h-13 bg-p2 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Saving..." : isNew ? "Start playing" : "Save username"}
      </button>
    </form>
  );
}
