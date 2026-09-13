import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email links and Google sign-ins land here. Links with a code use the PKCE
// flow, links with a token hash come from a custom email template.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let userId: string | undefined;

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    userId = data.user?.id;
  } else if (tokenHash && type) {
    const { data } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    userId = data.user?.id;
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in?error=confirm", request.url));
  }

  // Players who arrived without a username (for example from Google) pick one first.
  const { data: profile } = await supabase
    .from("profiles")
    .select("needs_username")
    .eq("id", userId)
    .maybeSingle();

  const destination = profile?.needs_username ? "/settings" : "/";
  return NextResponse.redirect(new URL(destination, request.url));
}
