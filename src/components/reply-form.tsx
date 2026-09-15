"use client";

import { useActionState, useState } from "react";
import { addReply, type ReplyState } from "@/app/reviews/actions";

const REPLY_LIMIT = 1000;

export function ReplyForm({ entryId }: { entryId: string }) {
  const [body, setBody] = useState("");
  const [state, formAction, pending] = useActionState<ReplyState, FormData>(async (previous, formData) => {
    const result = await addReply(previous, formData);
    if (result?.saved) setBody("");
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="entryId" value={entryId} />
      <div className="flex items-baseline justify-between">
        <label htmlFor="reply-body" className="font-pixel text-sm text-ink-soft">
          Your reply
        </label>
        <span className={`text-xs ${body.length > REPLY_LIMIT * 0.9 ? "text-p1" : "text-muted"}`}>
          {body.length} / {REPLY_LIMIT}
        </span>
      </div>
      <textarea
        id="reply-body"
        name="body"
        rows={4}
        required
        maxLength={REPLY_LIMIT}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add to the conversation"
        className="resize-y border-2 border-line bg-transparent px-3 py-2 leading-relaxed text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none"
      />

      {state?.error && (
        <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
          {state.error}
        </p>
      )}
      {state?.saved && !pending && body === "" && (
        <p role="status" className="text-sm text-p2">
          Reply sent.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || body.trim().length === 0}
        className="h-12 w-fit px-5 font-pixel key-button disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send reply"}
      </button>
    </form>
  );
}
