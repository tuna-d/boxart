import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentPlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

const errorMessages: Record<string, string> = {
  confirm: "That sign-in link is invalid or has expired. Try again, or join again for a new link.",
  google: "Could not reach Google. Try again in a moment.",
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  if (await getCurrentPlayer()) redirect("/");
  const { error } = await props.searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-14 pb-20">
      <div className="flex flex-col gap-4">
        <span className="font-pixel text-sm text-p1">&gt; Player 1</span>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)]">
          Sign in
        </h1>
        <p className="text-ink-soft">Load your save and pick up where you left off.</p>
      </div>

      {typeof error === "string" && Object.hasOwn(errorMessages, error) && (
        <p role="alert" className="border-2 border-dashed border-p1 p-3 text-sm text-p1">
          {errorMessages[error]}
        </p>
      )}

      <AuthForm mode="sign-in" />

      <p className="text-sm text-ink-soft">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-p2 uppercase hover:text-accent">
          2P Join
        </Link>
      </p>
    </main>
  );
}
