"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { QuickSearchResult } from "@/app/api/search/games/route";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/** The header search field. Shows the top matches as you type and opens the full results on Enter. */
export function GameSearchBox() {
  const [query, setQuery] = useState("");
  // Answers by lower case term, so going back to an earlier term needs no new request.
  const [answers, setAnswers] = useState<Record<string, QuickSearchResult[]>>({});
  const [lastAnswered, setLastAnswered] = useState("");
  const [failed, setFailed] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const id = useId();
  const term = query.trim();
  const key = term.toLowerCase();
  const searchable = term.length >= MIN_QUERY_LENGTH;
  const answered = key in answers;
  const seeAllHref = `/search?q=${encodeURIComponent(term)}`;
  // Keep the previous matches on screen while the next ones load.
  const results = answers[key] ?? answers[lastAnswered] ?? [];
  const status = !searchable ? "idle" : answered ? "done" : failed === key ? "error" : "loading";

  useEffect(() => {
    if (!searchable || answered) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/games?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data: { results: QuickSearchResult[] } = await response.json();
        setAnswers((current) => ({ ...current, [key]: data.results }));
        setLastAnswered(key);
      } catch {
        if (!controller.signal.aborted) setFailed(key);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term, key, searchable, answered]);

  useEffect(() => {
    // A typed term is cleared by a click elsewhere even after the dropdown has closed.
    if (!open && !query) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setQuery("");
      setOpen(false);
      setActive(-1);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, query]);

  const showPanel = open && searchable;

  // Leaving the search, by Escape, a click elsewhere or picking a result, starts the next one empty.
  function reset() {
    setQuery("");
    setOpen(false);
    setActive(-1);
  }
  const optionId = (index: number) => `${id}-option-${index}`;

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // The browser's own Escape only clears a search field, so also close and leave it.
      event.preventDefault();
      reset();
      event.currentTarget.blur();
      return;
    }
    if (!searchable || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && showPanel && active >= 0) {
      event.preventDefault();
      reset();
      router.push(`/games/${results[active].slug}`);
    }
  }

  return (
    <form
      ref={rootRef}
      action="/search"
      role="search"
      className="relative flex items-center gap-2 text-sm"
      onSubmit={() => setOpen(false)}
    >
      <label htmlFor={`${id}-input`} className="whitespace-nowrap text-muted">
        SEARCH &gt;
      </label>
      <input
        id={`${id}-input`}
        name="q"
        type="search"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        maxLength={80}
        aria-expanded={showPanel}
        aria-controls={`${id}-panel`}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
        placeholder="_"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-44 bg-transparent text-ink placeholder:text-muted focus:w-56 motion-safe:transition-[width]"
      />

      {showPanel && (
        <div
          id={`${id}-panel`}
          className="absolute top-full right-0 z-50 mt-5 w-[420px] border-2 border-accent bg-screen font-mono normal-case shadow-[6px_6px_0_var(--color-shade)]"
        >
          {results.length > 0 && status !== "error" ? (
            <ul role="listbox" aria-label="Games" className={status === "loading" ? "opacity-60" : undefined}>
              {results.map((result, index) => (
                <li
                  key={result.slug}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  className="border-b-2 border-dashed border-line"
                >
                  <Link
                    href={`/games/${result.slug}`}
                    tabIndex={-1}
                    onMouseEnter={() => setActive(index)}
                    onClick={reset}
                    className={`flex items-center gap-3 px-3 py-2.5 ${index === active ? "bg-accent/10 text-accent" : ""}`}
                  >
                    <span className="relative h-14 w-[42px] shrink-0 overflow-hidden bg-shade">
                      {result.coverUrl && (
                        <Image src={result.coverUrl} alt="" fill sizes="42px" className="object-cover" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-pixel text-sm uppercase">{result.title}</span>
                      <span className="text-xs text-muted">{result.year}</span>
                    </span>
                    {result.average !== null && (
                      <span className="font-pixel text-sm text-accent">{result.average.toFixed(1)}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm text-ink-soft" aria-live="polite">
              {status === "error"
                ? "Search is not available right now."
                : status === "done"
                  ? `No games match "${term}".`
                  : "Searching..."}
            </p>
          )}
          <Link
            href={seeAllHref}
            onClick={() => setOpen(false)}
            className="flex h-11 items-center justify-between px-4 font-pixel text-xs text-p2 uppercase hover:bg-p2/10"
          >
            <span className="truncate">See all results for &quot;{term}&quot;</span>
            <span aria-hidden="true">&gt;</span>
          </Link>
        </div>
      )}
    </form>
  );
}
