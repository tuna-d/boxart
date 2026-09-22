import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email links and Google sign-ins land here. Supabase sends the result three ways:
// a code to exchange (PKCE), a token hash to verify, or, when it cannot use either,
// tokens and errors in the URL fragment, which only the browser can read.

/** Where a player goes once their session exists. */
async function destinationFor(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("needs_username")
    .eq("id", userId)
    .maybeSingle();
  return profile?.needs_username ? "/settings" : "/";
}

function signInWith(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/sign-in?error=${error}`, request.url));
}

/** Supabase's own error codes, mapped to the messages the sign-in page knows. */
function messageFor(code: string | null, description: string | null) {
  if (code === "otp_expired" || description?.includes("expired")) return "expired";
  if (code === "access_denied") return "cancelled";
  return "confirm";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error");

  if (errorCode) {
    return signInWith(request, messageFor(errorCode, searchParams.get("error_description")));
  }

  const supabase = await createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      return NextResponse.redirect(new URL(await destinationFor(data.user.id), request.url));
    }
    // The link works only in the browser that started the sign-up, because the code is
    // paired with a cookie from that browser. The email itself is confirmed by now.
    console.error("Could not exchange the sign-in code", error?.message);
    return signInWith(request, "other_browser");
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (data.user) {
      return NextResponse.redirect(new URL(await destinationFor(data.user.id), request.url));
    }
    console.error("Could not verify the sign-in link", error?.message);
    return signInWith(request, "expired");
  }

  // Nothing in the query string, so let the browser look at the fragment.
  return new NextResponse(readFragmentPage, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Finishes a sign-in whose tokens arrived in the URL fragment. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
  const refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token : "";
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ destination: "/sign-in?error=confirm" });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!data.user) {
    console.error("Could not start the session from the link", error?.message);
    return NextResponse.json({ destination: "/sign-in?error=expired" });
  }

  return NextResponse.json({ destination: await destinationFor(data.user.id) });
}

const readFragmentPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Signing you in</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0d0c11;
        color: #efeae0;
        font: 15px/1.6 ui-monospace, "Courier New", monospace;
      }
    </style>
  </head>
  <body>
    <p id="status">Signing you in...</p>
    <script>
      (function () {
        var params = new URLSearchParams(location.hash.slice(1));
        var accessToken = params.get("access_token");
        var refreshToken = params.get("refresh_token");
        var errorCode = params.get("error_code") || params.get("error");
        if (!accessToken || !refreshToken) {
          var reason = errorCode === "otp_expired" ? "expired" : errorCode ? "confirm" : "confirm";
          location.replace("/sign-in?error=" + reason);
          return;
        }
        fetch("/auth/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (result) {
            location.replace(result.destination || "/");
          })
          .catch(function () {
            location.replace("/sign-in?error=confirm");
          });
      })();
    </script>
  </body>
</html>
`;
