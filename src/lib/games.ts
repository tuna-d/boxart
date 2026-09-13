import { sampleGames, sampleRatingStats, sampleReviews } from "./sample-data";
import type { Game, RatingStats, Review } from "./types";

// These read from sample data until IGDB and Supabase are connected.
// Pages only depend on these signatures, so swapping the source stays local to this file.

export async function getGameBySlug(slug: string): Promise<Game | null> {
  return sampleGames.find((game) => game.slug === slug) ?? null;
}

export async function getRatingStats(gameId: string): Promise<RatingStats> {
  return sampleRatingStats[gameId] ?? { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
}

export async function getPopularReviews(gameId: string, limit = 10): Promise<Review[]> {
  return sampleReviews
    .filter((review) => review.gameId === gameId)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
}
