import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { GameSearchBox } from "@/components/game-search-box";
import { NotificationBell } from "@/components/notification-bell";
import { PlayerMenu } from "@/components/player-menu";
import { getCurrentPlayer } from "@/lib/auth";
import { getNotifications } from "@/lib/follows";

const navLinks = [
  { href: "/games", label: "Games" },
  { href: "/lists", label: "Lists" },
  { href: "/players", label: "Players" },
];

export async function SiteHeader() {
  const player = await getCurrentPlayer();
  const notifications = player && !player.needsUsername ? await getNotifications(player.id, 8) : null;

  return (
    <header className="border-b-4 border-accent">
      <div className="relative flex h-19 items-center gap-4 px-6 md:gap-9 md:px-10">
        <Link
          href="/"
          className="font-pixel text-2xl leading-none font-bold tracking-wide text-accent md:text-[34px]"
        >
          BOXART
        </Link>

        <nav className="hidden gap-6 font-pixel text-[15px] uppercase md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden lg:block">
          <GameSearchBox />
        </div>

        <div className="ml-auto flex items-center gap-4 font-pixel text-sm whitespace-nowrap uppercase md:gap-6 md:text-[15px] lg:ml-0">
          {player ? (
            <>
              {notifications && <NotificationBell items={notifications.items} unread={notifications.unread} />}
              <div className="md:hidden">
                <PlayerMenu username={player.username} needsUsername={player.needsUsername} />
              </div>
              <Link
                href={
                  player.needsUsername || !player.username
                    ? "/settings"
                    : `/players/${encodeURIComponent(player.username)}`
                }
                title={player.needsUsername ? "Pick a username" : "Your profile"}
                className="hidden max-w-60 truncate text-accent hover:text-ink md:block"
              >
                {player.needsUsername ? "Enter name" : (player.username ?? "Player")}
              </Link>
              <form action={signOut} className="hidden md:block">
                <button type="submit" className="uppercase text-p2 hover:text-ink">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-p1 hover:text-ink">
                <span className="hidden sm:inline">1P </span>Sign in
              </Link>
              <Link href="/sign-up" className="text-p2 hover:text-ink">
                <span className="hidden sm:inline">2P </span>Join
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="flex gap-6 border-t-2 border-dashed border-line px-6 py-3 font-pixel text-sm uppercase md:hidden"
      >
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-accent">
            {link.label}
          </Link>
        ))}
        <Link href="/search" className="ml-auto text-muted hover:text-accent">
          Search
        </Link>
      </nav>
    </header>
  );
}
