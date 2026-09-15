import type { Metadata } from "next";
import Link from "next/link";
import { ListCard } from "@/components/list-card";
import { TabLink } from "@/components/tab-link";
import { getCurrentPlayer } from "@/lib/auth";
import { getLists } from "@/lib/lists";
import type { ListSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Lists",
};

const sortOptions: { value: ListSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "recent", label: "Recently updated" },
];

function isListSort(value: unknown): value is ListSort {
  return sortOptions.some((option) => option.value === value);
}

export default async function ListsPage(props: PageProps<"/lists">) {
  const searchParams = await props.searchParams;
  const sort = isListSort(searchParams.sort) ? searchParams.sort : "popular";
  const viewer = await getCurrentPlayer();
  const lists = await getLists({ sort, viewerId: viewer?.id });

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <span className="font-pixel text-sm text-p2">&gt; Level select</span>
          <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
            Lists
          </h1>
        </div>
        <Link
          href={viewer ? "/lists/new" : "/sign-in"}
          className="flex h-12 items-center px-5 font-pixel key-button"
        >
          + New list
        </Link>
      </div>

      <nav aria-label="Sort lists" className="mt-8 flex flex-wrap gap-2 border-y-2 border-dashed border-line py-4">
        {sortOptions.map((option) => (
          <TabLink
            key={option.value}
            href={option.value === "popular" ? "/lists" : `/lists?sort=${option.value}`}
            active={option.value === sort}
          >
            {option.label}
          </TabLink>
        ))}
      </nav>

      {lists.length === 0 ? (
        <p className="mt-8 text-ink-soft">No lists yet. Be the first to make one.</p>
      ) : (
        <ul className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lists.map((list) => (
            <li key={list.id}>
              <ListCard list={list} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
