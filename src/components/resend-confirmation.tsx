"use client";

import { useActionState, useState } from "react";
import { resendConfirmation, type AuthState } from "@/app/auth/actions";
import { TextField } from "@/components/text-field";

/** Sends a new confirmation email when the one in the inbox no longer works. */
export function ResendConfirmation() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(resendConfirmation, null);
  const [open, setOpen] = useState(false);

  if (state?.message) {
    return (
      <p role="status" className="border-2 border-dashed border-p2 p-3 text-sm text-p2">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit text-sm font-semibold text-p2 uppercase hover:text-accent"
      >
        Send a new confirmation email &gt;
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 border-2 border-dashed border-line p-4">
      <TextField
        id="resend-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        defaultValue={state?.email}
        hint="Open the new link in this browser to finish signing in."
      />
      {state?.error && (
        <p role="alert" className="text-sm text-p1">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-fit px-5 font-pixel key-button key-button-cyan disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending..." : "Send link"}
      </button>
    </form>
  );
}
