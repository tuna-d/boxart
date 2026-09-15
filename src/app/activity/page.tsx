import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { getCurrentPlayer } from "@/lib/auth";
import { getFriendActivity } from "@/lib/follows";

export const metadata: Metadata = {
  title: "Friends activity",
};

export default async function ActivityPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const activity = await getFriendActivity(player.id, 50);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-10 pb-16">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Friends feed</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Activity
        </h1>
        <p className="text-ink-soft">What the players you follow logged, rated, reviewed and listed.</p>
      </div>

      <div className="mt-8 border-t-2 border-dashed border-line pt-6">
        {activity.length === 0 ? (
          <p className="text-ink-soft">
            Nothing here yet.{" "}
            <Link href="/players" className="text-accent uppercase hover:text-ink">
              Find players to follow
            </Link>
          </p>
        ) : (
          <ActivityFeed items={activity} />
        )}
      </div>
    </main>
  );
}
