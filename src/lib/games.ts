import { sampleGames, sampleRatingStats, sampleReviews } from "./sample-data";
import type { Game, GameListItem, GameSort, RatingStats, Review } from "./types";

// These read from sample data until IGDB and Supabase are connected.
// Pages only depend on these signatures, so swapping the source stays local to this file.

const emptyStats: RatingStats = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };

const sorters: Record<GameSort, (a: GameListItem, b: GameListItem) => number> = {
  popular: (a, b) => b.stats.count - a.stats.count,
  rating: (a, b) => b.stats.average - a.stats.average || b.stats.count - a.stats.count,
  newest: (a, b) => b.game.releaseDate.localeCompare(a.game.releaseDate),
};

export async function getGameBySlug(slug: string): Promise<Game | null> {
  return sampleGames.find((game) => game.slug === slug) ?? null;
}

export async function getRatingStats(gameId: string): Promise<RatingStats> {
  return sampleRatingStats[gameId] ?? emptyStats;
}

export async function listGames({
  sort = "popular",
  genre,
}: { sort?: GameSort; genre?: string } = {}): Promise<GameListItem[]> {
  return sampleGames
    .filter((game) => !genre || game.genres.includes(genre))
    .map((game) => ({ game, stats: sampleRatingStats[game.id] ?? emptyStats }))
    .sort(sorters[sort]);
}

export async function listGenres(): Promise<string[]> {
  return [...new Set(sampleGames.flatMap((game) => game.genres))].sort();
}

export async function getPopularReviews(gameId: string, limit = 10): Promise<Review[]> {
  return sampleReviews
    .filter((review) => review.gameId === gameId)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
}
