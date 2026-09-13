import Link from "next/link";

type TabLinkProps = {
  href: string;
  active: boolean;
  children: React.ReactNode;
};

export function TabLink({ href, active, children }: TabLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 items-center border-2 px-3.5 text-sm font-semibold uppercase ${
        active ? "border-accent bg-accent text-screen" : "border-ink hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </Link>
  );
}
