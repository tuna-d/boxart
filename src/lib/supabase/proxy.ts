import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "./env";
import { REMEMBER_COOKIE, remembers, withRememberChoice } from "./remember";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const keepSignedIn = remembers(request.cookies.get(REMEMBER_COOKIE)?.value);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, withRememberChoice(value, options, keepSignedIn));
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Validating the claims refreshes an expired session and writes the new cookies.
  await supabase.auth.getClaims();

  return response;
}
