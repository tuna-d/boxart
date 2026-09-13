"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
  email?: string;
  username?: string;
} | null;

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

async function siteOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = readText(formData, "email");
  const password = readPassword(formData);
  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirm your email first. The link is in your inbox.", email };
    }
    if (error.code === "invalid_credentials") {
      return { error: "Wrong email or password.", email };
    }
    return { error: "Could not sign in. Try again in a moment.", email };
  }

  redirect("/");
}

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const username = readText(formData, "username");
  const email = readText(formData, "email");
  const password = readPassword(formData);
  const values = { email, username };

  if (!USERNAME_PATTERN.test(username)) {
    return { ...values, error: "Usernames are 3-20 letters, numbers, dots or underscores." };
  }
  if (!email) {
    return { ...values, error: "Enter your email." };
  }
  if (password.length < 8) {
    return { ...values, error: "Passwords need at least 8 characters." };
  }

  const supabase = await createClient();
  const { data: available, error: lookupError } = await supabase.rpc("username_available", {
    name: username,
  });
  if (lookupError) {
    return { ...values, error: "Could not check that username. Try again in a moment." };
  }
  if (!available) {
    return { ...values, error: "That username is taken." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { ...values, error: "Pick a stronger password." };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { ...values, error: "Too many sign-ups right now. Try again in a few minutes." };
    }
    return { ...values, error: "Could not create your account. Try again in a moment." };
  }

  return { message: `Almost there. Open the link we sent to ${email} to start playing.` };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/confirm` },
  });

  redirect(error || !data.url ? "/sign-in?error=google" : data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
