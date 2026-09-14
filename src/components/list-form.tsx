"use client";

import { useActionState, useState } from "react";
import { createList, updateList, type ListFormState } from "@/app/lists/actions";
import { TextField } from "@/components/text-field";

const DESCRIPTION_LIMIT = 1000;

type ListFormProps = {
  list?: {
    id: string;
    title: string;
    description: string | null;
    ranked: boolean;
  };
};

export function ListForm({ list }: ListFormProps) {
  const [state, formAction, pending] = useActionState<ListFormState, FormData>(
    list ? updateList : createList,
    null,
  );
  const values = state?.values ?? {
    title: list?.title ?? "",
    description: list?.description ?? "",
    ranked: list?.ranked ?? false,
  };
  const [description, setDescription] = useState(values.description);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {list && <input type="hidden" name="listId" value={list.id} />}

      <TextField
        id="list-title"
        name="title"
        label="Title"
        required
        maxLength={80}
        defaultValue={values.title}
        placeholder="Games that ruined my sleep schedule"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="list-description" className="font-pixel text-sm text-ink-soft">
            Description
          </label>
          <span className="text-xs text-muted">
            {description.length} / {DESCRIPTION_LIMIT}
          </span>
        </div>
        <textarea
          id="list-description"
          name="description"
          rows={4}
          maxLength={DESCRIPTION_LIMIT}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What ties these games together?"
          className="resize-y border-2 border-line bg-transparent px-3 py-2 leading-relaxed text-ink placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="ranked"
          defaultChecked={values.ranked}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="mt-0.5 font-pixel whitespace-pre text-accent peer-checked:hidden peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        >
          [ ]
        </span>
        <span
          aria-hidden="true"
          className="mt-0.5 hidden font-pixel text-accent peer-checked:inline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        >
          [x]
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-pixel text-sm">Ranked list</span>
          <span className="text-xs text-muted">Number the games so their order counts.</span>
        </span>
      </label>

      {state?.error && (
        <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-13 bg-p1 font-pixel text-lg text-screen shadow-[4px_4px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Saving..." : list ? "Save list" : "Create list"}
      </button>
    </form>
  );
}
