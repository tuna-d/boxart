import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsernameForm } from "@/components/username-form";
import { getCurrentPlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const isNew = player.needsUsername;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-14 pb-20">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; {isNew ? "New player" : "Settings"}</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
          {isNew ? "Enter your name" : "Username"}
        </h1>
        <p className="text-ink-soft">
          {isNew
            ? "Every high-score table needs a name. Pick the one other players will see."
            : "This is the name on your profile and next to your reviews."}
        </p>
      </div>

      <UsernameForm currentUsername={player.username ?? ""} isNew={isNew} />
    </main>
  );
}
