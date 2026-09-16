import { cache } from "react";
import { cleanPlatforms, type PlatformId } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";

export type CurrentPlayer = {
  id: string;
  username: string | null;
  needsUsername: boolean;
  platforms: PlatformId[];
};

// Cached per request so the header and the page share one lookup.
export const getCurrentPlayer = cache(async (): Promise<CurrentPlayer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, needs_username, platforms")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    username: profile?.username ?? null,
    needsUsername: profile?.needs_username ?? false,
    platforms: cleanPlatforms(profile?.platforms ?? []),
  };
});
