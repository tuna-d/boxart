import type { CookieOptions } from "@supabase/ssr";

/** Holds "0" when the player chose not to stay signed in after closing the browser. */
export const REMEMBER_COOKIE = "boxart-remember";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function remembers(value: string | undefined) {
  return value !== "0";
}

/**
 * Turns auth cookies into browser session cookies when the player asked not to be
 * remembered. Cookies that are being cleared keep their expiry so they still get removed.
 */
export function withRememberChoice(value: string, options: CookieOptions, remember: boolean): CookieOptions {
  if (remember || value === "" || options.maxAge === 0) return options;
  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return sessionOptions;
}

export function rememberCookieOptions(remember: boolean): CookieOptions {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(remember && { maxAge: ONE_YEAR }),
  };
}
