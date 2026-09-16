"use client";

import { useActionState } from "react";
import { updatePlatforms, type PlatformsState } from "@/app/settings/actions";
import { PlatformPicker } from "@/components/platform-picker";
import type { PlatformId } from "@/lib/platforms";

export function PlatformsForm({ current, labelledBy }: { current: PlatformId[]; labelledBy: string }) {
  const [state, formAction, pending] = useActionState<PlatformsState, FormData>(updatePlatforms, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* The key resets the ticks to what was saved after each submit. */}
      <PlatformPicker
        key={state?.platforms?.join() ?? "initial"}
        selected={state?.platforms ?? current}
        labelledBy={labelledBy}
      />

      {state?.error && (
        <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="border-2 border-dashed border-p2 p-3 text-sm text-p2">
          Saved. Your platforms are on your profile.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-13 border-2 border-ink font-pixel text-lg hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save platforms"}
      </button>
    </form>
  );
}
