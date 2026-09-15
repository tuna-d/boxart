import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./env";
import { REMEMBER_COOKIE, remembers, withRememberChoice } from "./remember";

/**
 * @param remember Overrides the saved "keep me signed in" choice, for the request that makes it.
 */
export async function createClient({ remember }: { remember?: boolean } = {}) {
  const cookieStore = await cookies();
  const keepSignedIn = remember ?? remembers(cookieStore.get(REMEMBER_COOKIE)?.value);

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, withRememberChoice(value, options, keepSignedIn));
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}
