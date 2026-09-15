import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { NotificationBell } from "@/components/notification-bell";
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
      <div className="flex h-19 items-center gap-4 px-6 md:gap-9 md:px-10">
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

        <form action="/search" className="ml-auto hidden items-center gap-2 text-sm lg:flex">
          <label htmlFor="site-search" className="whitespace-nowrap text-muted">
            SEARCH &gt;
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="_"
            className="w-44 bg-transparent text-ink placeholder:text-muted"
          />
        </form>

        <div className="ml-auto flex items-center gap-4 font-pixel text-sm whitespace-nowrap uppercase md:gap-6 md:text-[15px] lg:ml-0">
          {player ? (
            <>
              {notifications && <NotificationBell items={notifications.items} unread={notifications.unread} />}
              <Link
                href={
                  player.needsUsername || !player.username
                    ? "/settings"
                    : `/players/${encodeURIComponent(player.username)}`
                }
                title={player.needsUsername ? "Pick a username" : "Your profile"}
                className="max-w-[40vw] truncate text-accent hover:text-ink"
              >
                <span className="hidden sm:inline">1P </span>
                {player.needsUsername ? "Enter name" : (player.username ?? "Player")}
              </Link>
              <form action={signOut}>
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
