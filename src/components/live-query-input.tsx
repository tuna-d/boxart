"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type InputHTMLAttributes } from "react";

type LiveQueryInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "onChange" | "value"> & {
  /** The page to update, for example "/players". */
  path: string;
  /** Other search params to keep, such as the current sort. */
  params?: Record<string, string>;
  delay?: number;
};

/**
 * A `q` search field that updates the page's results while typing. It stays inside a normal
 * GET form, so pressing Enter or using the page without JavaScript still works.
 */
export function LiveQueryInput({ path, params = {}, delay = 300, className, ...inputProps }: LiveQueryInputProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function update(value: string) {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const search = new URLSearchParams(params);
      const term = value.trim();
      if (term) search.set("q", term);
      const query = search.toString();
      startTransition(() => {
        router.replace(query ? `${path}?${query}` : path, { scroll: false });
      });
    }, delay);
  }

  return (
    <input
      {...inputProps}
      name="q"
      type="search"
      autoComplete="off"
      aria-busy={pending}
      onChange={(event) => update(event.target.value)}
      className={`${className ?? ""} ${pending ? "border-dashed" : ""}`}
    />
  );
}
