import "server-only";
import type { Game, GameSort, Genre } from "@/lib/types";
import { igdbQuery } from "./client";

type IgdbGame = {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  first_release_date?: number;
  cover?: { image_id: string };
  genres?: { name: string }[];
  platforms?: { name: string; abbreviation?: string }[];
  involved_companies?: { developer: boolean; company: { name: string } }[];
  total_rating_count?: number;
};

const GAME_FIELDS = [
  "name",
  "slug",
  "summary",
  "first_release_date",
  "cover.image_id",
  "genres.name",
  "platforms.name",
  "platforms.abbreviation",
  "involved_companies.developer",
  "involved_companies.company.name",
  "total_rating_count",
].join(", ");

// Main games, remakes, remasters and expanded editions. Leaves out DLC, bundles and mods.
const PLAYABLE = "game_type = (0,8,9,10)";
const LIST_LIMIT = 36;

const platformLabels: Record<string, string> = {
  "Series X|S": "Xbox Series",
  XONE: "Xbox One",
  X360: "Xbox 360",
  XBOX: "Xbox",
};

// Current platforms first, everything else keeps IGDB's order after them.
const platformOrder = ["PC", "PS5", "Xbox Series", "Switch 2", "Switch", "PS4", "Xbox One"];

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function unique(values: string[]) {
  return [...new Set(values)];
}

function byPlatformOrder(a: string, b: string) {
  const rank = (label: string) => {
    const index = platformOrder.indexOf(label);
    return index === -1 ? platformOrder.length : index;
  };
  return rank(a) - rank(b);
}

function toGame(game: IgdbGame): Game {
  return {
    id: String(game.id),
    slug: game.slug,
    title: game.name,
    summary: game.summary ?? "",
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    developers: unique(
      (game.involved_companies ?? []).filter((item) => item.developer).map((item) => item.company.name),
    ),
    genres: (game.genres ?? []).map((genre) => genre.name),
    platforms: unique(
      (game.platforms ?? []).map(
        (platform) => platformLabels[platform.abbreviation ?? ""] ?? platform.abbreviation ?? platform.name,
      ),
    ).sort(byPlatformOrder),
    coverUrl: game.cover
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${game.cover.image_id}.jpg`
      : null,
  };
}

export async function fetchGameBySlug(slug: string): Promise<Game | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const [game] = await igdbQuery<IgdbGame>("games", `fields ${GAME_FIELDS}; where slug = "${slug}"; limit 1;`);
  return game ? toGame(game) : null;
}

export async function fetchGames({ sort, genre }: { sort: GameSort; genre?: string }): Promise<Game[]> {
  // Rounded to the hour so the query text, and with it the cached response, stays stable.
  const now = Math.floor(Date.now() / 3_600_000) * 3600;
  const filters = ["cover != null", PLAYABLE];
  if (genre && SLUG_PATTERN.test(genre)) filters.push(`genres.slug = "${genre}"`);

  let order = "total_rating_count desc";
  if (sort === "popular") {
    filters.push("total_rating_count != null");
  } else if (sort === "rating") {
    filters.push("total_rating_count >= 200");
    order = "total_rating desc";
  } else {
    // Released in the last six months and noticed by at least a few people.
    const sixMonthsAgo = now - 180 * 24 * 60 * 60;
    filters.push(`first_release_date < ${now}`, `first_release_date > ${sixMonthsAgo}`);
    filters.push("(hypes >= 30 | total_rating_count >= 5)");
    order = "first_release_date desc";
  }

  const games = await igdbQuery<IgdbGame>(
    "games",
    `fields ${GAME_FIELDS}; where ${filters.join(" & ")}; sort ${order}; limit ${LIST_LIMIT};`,
  );
  return games.map(toGame);
}

export async function fetchGenres(): Promise<Genre[]> {
  return igdbQuery<Genre>("genres", "fields name, slug; sort name asc; limit 50;", 60 * 60 * 24 * 7);
}

export async function searchIgdbGames(term: string): Promise<Game[]> {
  const cleaned = term.replace(/["\\]/g, " ").trim().slice(0, 80);
  if (!cleaned) return [];

  const games = await igdbQuery<IgdbGame>(
    "games",
    `search "${cleaned}"; fields ${GAME_FIELDS}; where ${PLAYABLE}; limit 40;`,
    60 * 60,
  );
  // IGDB ranks by text match only, so lift the games people actually know.
  return games
    .sort((a, b) => (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0))
    .map(toGame);
}
