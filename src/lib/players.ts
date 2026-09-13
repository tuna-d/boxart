import { sampleGames, sampleLibrary, samplePlayers, sampleReviews } from "./sample-data";
import type { Game, LibraryItem, LibraryStatus, Player, PlayerReview } from "./types";

// Sample data until Supabase is connected, same as games.ts.

function findGame(gameId: string): Game | undefined {
  return sampleGames.find((game) => game.id === gameId);
}

export async function getPlayer(username: string): Promise<Player | null> {
  return samplePlayers.find((player) => player.username === username) ?? null;
}

export async function getPlayerLibrary(username: string): Promise<LibraryItem[]> {
  return sampleLibrary
    .filter((entry) => entry.username === username)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .flatMap((entry) => {
      const game = findGame(entry.gameId);
      return game ? [{ game, entry }] : [];
    });
}

export function countByStatus(library: LibraryItem[]): Record<LibraryStatus, number> {
  const counts: Record<LibraryStatus, number> = { played: 0, playing: 0, backlog: 0 };
  for (const { entry } of library) counts[entry.status] += 1;
  return counts;
}

export async function getPlayerReviews(username: string): Promise<PlayerReview[]> {
  return sampleReviews
    .filter((review) => review.author.username === username)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((review) => {
      const game = findGame(review.gameId);
      return game ? [{ game, review }] : [];
    });
}
