"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signInWithGoogle, signUp, type AuthState } from "@/app/auth/actions";
import { TextField } from "@/components/text-field";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

const modes = {
  "sign-in": { action: signIn, label: "Press start", pendingLabel: "Loading...", color: "bg-p1" },
  "sign-up": { action: signUp, label: "Insert coin", pendingLabel: "Creating...", color: "bg-p2" },
};

export function AuthForm({ mode }: AuthFormProps) {
  const settings = modes[mode];
  const [state, formAction, pending] = useActionState<AuthState, FormData>(settings.action, null);
  // One choice covers both forms, so Google sign-ins follow the checkbox too.
  const [remember, setRemember] = useState(true);
  const rememberInput = mode === "sign-in" && <input type="hidden" name="remember" value={remember ? "1" : "0"} />;

  if (state?.message) {
    return (
      <p role="status" className="border-2 border-dashed border-p2 p-4 leading-relaxed text-p2">
        {state.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={signInWithGoogle}>
        {rememberInput}
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3 font-pixel text-xs text-muted" aria-hidden="true">
        <span className="h-0.5 flex-1 bg-line" />
        or
        <span className="h-0.5 flex-1 bg-line" />
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        {rememberInput}
        {mode === "sign-up" && (
          <TextField
            id="username"
            name="username"
            label="Username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_.]+"
            defaultValue={state?.username}
            hint="3-20 characters: letters, numbers, dots and underscores."
          />
        )}
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          defaultValue={state?.email}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
          minLength={mode === "sign-up" ? 8 : undefined}
          hint={mode === "sign-up" ? "At least 8 characters." : undefined}
        />

        {mode === "sign-in" && (
          <label className="flex w-fit cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="font-pixel whitespace-pre text-accent peer-checked:hidden peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            >
              [ ]
            </span>
            <span
              aria-hidden="true"
              className="hidden font-pixel text-accent peer-checked:inline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            >
              [x]
            </span>
            <span className="text-sm text-ink-soft">Keep me signed in</span>
          </label>
        )}

        {state?.error && (
          <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`mt-2 h-13 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-70 ${settings.color}`}
        >
          {pending ? settings.pendingLabel : settings.label}
        </button>
      </form>
    </div>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-3 border-2 border-ink bg-ink font-semibold text-screen hover:border-accent hover:bg-accent disabled:cursor-wait disabled:opacity-70"
    >
      <GoogleMark />
      {pending ? "Opening Google..." : "Continue with Google"}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
