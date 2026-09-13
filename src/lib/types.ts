export type Game = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  releaseDate: string;
  developers: string[];
  genres: string[];
  platforms: string[];
  coverUrl: string | null;
};

export type RatingStats = {
  average: number;
  count: number;
  /** Number of ratings per heart bucket, index 0 is one heart and index 4 is five hearts. */
  distribution: [number, number, number, number, number];
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
