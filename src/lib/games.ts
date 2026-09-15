import { fetchGameBySlug, fetchGames, fetchGenres, searchIgdbGames } from "./igdb/games";
import { withRatingSummaries } from "./library";
import type { Game, GameListItem, GameSort, Genre } from "./types";

// Games come from IGDB, ratings from the shelves players keep in Supabase.

export async function getGameBySlug(slug: string): Promise<Game | null> {
  return fetchGameBySlug(slug);
}

export async function listGames({
  sort = "popular",
  genre,
  offset = 0,
}: { sort?: GameSort; genre?: string; offset?: number } = {}): Promise<GameListItem[]> {
  return withRatingSummaries(await fetchGames({ sort, genre, offset }));
}

export async function listGenres(): Promise<Genre[]> {
  return fetchGenres();
}

export async function searchGames(term: string): Promise<GameListItem[]> {
  return withRatingSummaries(await searchIgdbGames(term));
}
