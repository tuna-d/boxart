import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListForm } from "@/components/list-form";
import { getCurrentPlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "New list",
};

export default async function NewListPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-xl px-6 pt-10 pb-16">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; New list</span>
        <h1 className="font-pixel text-3xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-4xl">
          Make a list
        </h1>
        <p className="text-ink-soft">Name it first. You can add games right after.</p>
      </div>
      <div className="mt-8">
        <ListForm />
      </div>
    </main>
  );
}
