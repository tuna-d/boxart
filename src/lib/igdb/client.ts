import "server-only";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const API_URL = "https://api.igdb.com/v4";
const ONE_DAY = 60 * 60 * 24;

let cachedToken: { value: string; expiresAt: number } | null = null;

function credentials() {
  const clientId = process.env.IGDB_CLIENT_ID?.trim();
  const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET. Copy .env.example to .env.local and fill it in.");
  }
  return { clientId, clientSecret };
}

async function getToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetch(`${TOKEN_URL}?${params}`, { method: "POST", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Twitch token request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  // Renew an hour before Twitch expires the token.
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 3600) * 1000 };
  return cachedToken.value;
}

/**
 * Sends an Apicalypse query to an IGDB endpoint. Responses are cached so
 * repeat visits stay well under the four requests per second limit.
 */
export async function igdbQuery<T>(endpoint: string, query: string, revalidate = ONE_DAY): Promise<T[]> {
  const { clientId } = credentials();

  const send = (token: string) =>
    fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Client-ID": clientId, Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
      body: query,
      cache: "force-cache",
      next: { revalidate },
    });

  let response = await send(await getToken());
  if (response.status === 401) {
    response = await send(await getToken(true));
  } else if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await send(await getToken());
  }

  if (!response.ok) {
    throw new Error(`IGDB ${endpoint} request failed with status ${response.status}`);
  }
  return response.json();
}
