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

/** The part of a game that shelves and review lists need, stored with each shelf entry. */
export type GameSummary = Pick<Game, "id" | "slug" | "title" | "coverUrl" | "releaseDate">;

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
  stats: Pick<RatingStats, "average" | "count">;
};

export type Player = {
  id: string;
  username: string;
  bio: string;
  joinedAt: string;
};

export type LibraryStatus = "played" | "playing" | "backlog";

export type LibraryEntry = {
  id: string;
  status: LibraryStatus;
  /** Half-heart steps from 0.5 to 5, or null when the player has not rated the game. */
  rating: number | null;
  platform: string | null;
  hoursPlayed: number | null;
  review: string | null;
  updatedAt: string;
};

export type LibraryItem = {
  game: GameSummary;
  entry: LibraryEntry;
};

export type Review = {
  /** The id of the shelf entry that holds the review. */
  id: string;
  author: {
    username: string;
  };
  rating: number | null;
  body: string;
  platform: string | null;
  hoursPlayed: number | null;
  likes: number;
  likedByViewer: boolean;
  createdAt: string;
};

export type PlayerReview = {
  game: GameSummary;
  review: Review;
};

export type PlayerSort = "active" | "liked" | "newest";

export type PlayerListItem = {
  player: Player;
  gamesCount: number;
  reviewsCount: number;
  likesReceived: number;
  lastActiveAt: string | null;
  recentGames: Pick<GameSummary, "slug" | "title" | "coverUrl">[];
};
