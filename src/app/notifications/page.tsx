import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationRow } from "@/components/notification-bell";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
import { getCurrentPlayer } from "@/lib/auth";
import { getNotifications } from "@/lib/follows";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/sign-in");

  const { items, unread } = await getNotifications(player.id, 100);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-10 pb-16">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Inbox</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Notifications
        </h1>
      </div>

      {unread > 0 && <MarkNotificationsRead />}

      <div className="mt-8 border-2 border-line">
        {items.length === 0 ? (
          <p className="px-4 py-5 text-ink-soft">No notifications yet. New followers and replies show up here.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} path="/notifications" />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
