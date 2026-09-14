import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteListButton } from "@/components/delete-list-button";
import { ListForm } from "@/components/list-form";
import { getCurrentPlayer } from "@/lib/auth";
import { getList, parseListId } from "@/lib/lists";

export const metadata: Metadata = {
  title: "Edit list",
};

export default async function EditListPage(props: PageProps<"/lists/[id]/edit">) {
  const { id } = await props.params;
  const listId = parseListId(id);
  if (!listId) notFound();

  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const list = await getList(listId);
  if (!list) notFound();
  if (list.author.id !== player.id) redirect(`/lists/${list.id}`);

  return (
    <main className="mx-auto w-full max-w-xl px-6 pt-10 pb-16">
      <div className="flex flex-col gap-4">
        <Link href={`/lists/${list.id}`} className="w-fit font-pixel text-sm text-p2 hover:text-ink">
          &lt; Back to list
        </Link>
        <h1 className="font-pixel text-3xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-4xl">
          Edit list
        </h1>
      </div>
      <div className="mt-8">
        <ListForm list={list} />
      </div>
      <div className="mt-12 border-t-2 border-dashed border-line pt-6">
        <DeleteListButton listId={list.id} />
      </div>
    </main>
  );
}
