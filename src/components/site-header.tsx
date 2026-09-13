import Link from "next/link";

const navLinks = [
  { href: "/games", label: "Games" },
  { href: "/lists", label: "Lists" },
  { href: "/players", label: "Players" },
];

export function SiteHeader() {
  return (
    <header className="border-b-4 border-accent">
      <div className="flex h-19 items-center gap-9 px-6 md:px-10">
        <Link
          href="/"
          className="font-pixel text-[34px] leading-none font-bold tracking-wide text-accent"
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
            className="w-44 bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </form>

        <div className="ml-auto flex gap-6 font-pixel text-[15px] whitespace-nowrap uppercase lg:ml-0">
          <Link href="/sign-in" className="text-p1 hover:text-ink">
            1P Sign in
          </Link>
          <Link href="/sign-up" className="text-p2 hover:text-ink">
            2P Join
          </Link>
        </div>
      </div>
    </header>
  );
}
