export type Game = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  /** ISO date (YYYY-MM-DD), or null when the release date is unknown. */
  releaseDate: string | null;
  developers: string[];
  genres: string[];
  platforms: string[];
  coverUrl: string | null;
};

export type Genre = {
  name: string;
  slug: string;
};

export type RatingStats = {
  average: number;
  count: number;
  /** Number of ratings per heart bucket, index 0 is one heart and index 4 is five hearts. */
  distribution: [number, number, number, number, number];
};

export type GameSort = "popular" | "rating" | "newest";

export type GameListItem = {
  game: Game;
  stats: RatingStats;
};

export type Player = {
  username: string;
  bio: string;
  joinedAt: string;
};

export type LibraryStatus = "played" | "playing" | "backlog";

export type LibraryEntry = {
  username: string;
  gameId: string;
  status: LibraryStatus;
  /** Half-heart steps from 0.5 to 5, or null when the player has not rated the game. */
  rating: number | null;
  updatedAt: string;
};

export type LibraryItem = {
  game: Game;
  entry: LibraryEntry;
};

export type PlayerReview = {
  game: Game;
  review: Review;
};

export type Review = {
  id: string;
  gameId: string;
  author: {
    username: string;
  };
  /** Half-heart steps from 0.5 to 5. */
  rating: number;
  body: string;
  platform: string;
  hoursPlayed: number | null;
  likes: number;
  createdAt: string;
};
