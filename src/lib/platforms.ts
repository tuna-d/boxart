/**
 * Platforms a player can pick for their profile. The ids are checked by the database,
 * so a new one needs a migration too. `gameLabels` are the platform names game pages use.
 */
export const PLATFORMS = [
  { id: "pc", label: "PC", gameLabels: ["PC"] },
  { id: "steam-deck", label: "Steam Deck", gameLabels: ["PC", "Linux"] },
  { id: "ps5", label: "PS5", gameLabels: ["PS5"] },
  { id: "ps4", label: "PS4", gameLabels: ["PS4"] },
  { id: "xbox-series", label: "Xbox Series", gameLabels: ["Xbox Series"] },
  { id: "xbox-one", label: "Xbox One", gameLabels: ["Xbox One"] },
  { id: "switch-2", label: "Switch 2", gameLabels: ["Switch 2"] },
  { id: "switch", label: "Switch", gameLabels: ["Switch"] },
  { id: "mac", label: "Mac", gameLabels: ["Mac"] },
  { id: "mobile", label: "Mobile", gameLabels: ["iOS", "Android"] },
  { id: "vr", label: "VR", gameLabels: ["Meta Quest 2", "Meta Quest 3", "PS VR2", "SteamVR", "Oculus Rift"] },
  { id: "retro", label: "Retro", gameLabels: [] },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

const byId = new Map<string, (typeof PLATFORMS)[number]>(PLATFORMS.map((platform) => [platform.id, platform]));

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === "string" && byId.has(value);
}

/** Known ids only, without repeats, in the order of the list above. */
export function cleanPlatforms(values: unknown[]): PlatformId[] {
  const chosen = new Set(values.filter(isPlatformId));
  return PLATFORMS.map((platform) => platform.id).filter((id) => chosen.has(id));
}

export function platformLabel(id: PlatformId): string {
  return byId.get(id)?.label ?? id;
}

/**
 * The game platform to preselect when logging a game: the first one the game is on
 * that matches a platform the player picked. Null when nothing matches.
 */
export function defaultGamePlatform(gamePlatforms: readonly string[], playerPlatforms: readonly PlatformId[]) {
  const playable = new Set<string>(playerPlatforms.flatMap((id) => byId.get(id)?.gameLabels ?? []));
  return gamePlatforms.find((label) => playable.has(label)) ?? null;
}
