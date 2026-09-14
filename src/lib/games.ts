import { fetchGameBySlug, fetchGames, fetchGenres, searchIgdbGames } from "./igdb/games";
import { sampleRatingStats, sampleReviews } from "./sample-data";
import type { Game, GameListItem, GameSort, Genre, RatingStats, Review } from "./types";

// Games come from IGDB. Ratings and reviews still read from sample data, keyed
// by slug, until they move to Supabase.

const emptyStats: RatingStats = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };

export async function getGameBySlug(slug: string): Promise<Game | null> {
  return fetchGameBySlug(slug);
}

export async function getRatingStats(game: Game): Promise<RatingStats> {
  return sampleRatingStats[game.slug] ?? emptyStats;
}

async function withStats(games: Game[]): Promise<GameListItem[]> {
  return Promise.all(games.map(async (game) => ({ game, stats: await getRatingStats(game) })));
}

export async function listGames({
  sort = "popular",
  genre,
}: { sort?: GameSort; genre?: string } = {}): Promise<GameListItem[]> {
  return withStats(await fetchGames({ sort, genre }));
}

export async function listGenres(): Promise<Genre[]> {
  return fetchGenres();
}

export async function searchGames(term: string): Promise<GameListItem[]> {
  return withStats(await searchIgdbGames(term));
}

export async function getPopularReviews(game: Game, limit = 10): Promise<Review[]> {
  return sampleReviews
    .filter((review) => review.gameId === game.slug)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
}
