import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BioForm } from "@/components/bio-form";
import { PlatformsForm } from "@/components/platforms-form";
import { UsernameForm } from "@/components/username-form";
import { getCurrentPlayer } from "@/lib/auth";
import { getPlayer } from "@/lib/players";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const isNew = player.needsUsername;

  if (isNew) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-14 pb-20">
        <div className="flex flex-col gap-4">
          <span className="font-pixel text-sm text-p2">&gt; New player</span>
          <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
            Enter your name
          </h1>
          <p className="text-ink-soft">Every high-score table needs a name. Pick the one other players will see.</p>
        </div>

        <UsernameForm currentUsername={player.username ?? ""} isNew />
      </main>
    );
  }

  const profile = player.username ? await getPlayer(player.username) : null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-14 pb-20">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Settings</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
          Profile
        </h1>
        {player.username && (
          <Link
            href={`/players/${encodeURIComponent(player.username)}`}
            className="w-fit text-sm font-semibold text-accent uppercase hover:text-ink"
          >
            View your profile &gt;
          </Link>
        )}
      </div>

      <section aria-labelledby="username-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="username-heading" className="font-pixel text-xl">
            Username
          </h2>
          <p className="text-sm text-ink-soft">This is the name on your profile and next to your reviews.</p>
        </div>
        <UsernameForm currentUsername={player.username ?? ""} isNew={false} />
      </section>

      <section
        aria-labelledby="bio-heading"
        className="flex flex-col gap-4 border-t-2 border-dashed border-line pt-8"
      >
        <div className="flex flex-col gap-2">
          <h2 id="bio-heading" className="font-pixel text-xl">
            About you
          </h2>
          <p className="text-sm text-ink-soft">A few lines shown under your name on your profile.</p>
        </div>
        <BioForm currentBio={profile?.bio ?? ""} />
      </section>

      <section
        aria-labelledby="platforms-heading"
        className="flex flex-col gap-4 border-t-2 border-dashed border-line pt-8"
      >
        <div className="flex flex-col gap-2">
          <h2 id="platforms-heading" className="font-pixel text-xl">
            Platforms
          </h2>
          <p className="text-sm text-ink-soft">
            Where you play. They show as badges on your profile and are picked first when you log a game.
          </p>
        </div>
        <PlatformsForm current={player.platforms} labelledBy="platforms-heading" />
      </section>
    </main>
  );
}
