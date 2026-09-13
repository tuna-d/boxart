import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Join",
};

export default function SignUpPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-14 pb-20">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p2">&gt; Player 2</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
          Join
        </h1>
        <p className="text-ink-soft">Start a new save file for every game you play.</p>
      </div>

      <AuthForm mode="sign-up" />

      <p className="text-sm text-ink-soft">
        Already have a save?{" "}
        <Link href="/sign-in" className="font-semibold text-p1 uppercase hover:text-accent">
          1P Sign in
        </Link>
      </p>
    </main>
  );
}
