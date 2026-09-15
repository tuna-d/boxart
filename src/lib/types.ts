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

export type ShelfFilter = LibraryStatus | "all" | "rated";

export type ShelfSort = "recent" | "rating-high" | "rating-low" | "title";

export type ShelfStats = {
  counts: Record<ShelfFilter, number>;
  ratings: RatingStats;
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
  replies: number;
  createdAt: string;
};

export type PlayerReview = {
  game: GameSummary;
  review: Review;
};

/** A single review with its author's id, for the review page. */
export type ReviewDetail = {
  game: GameSummary;
  review: Review & { author: PlayerLink };
};

export type ReviewReply = {
  id: string;
  author: PlayerLink;
  body: string;
  createdAt: string;
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

export type ListSort = "popular" | "recent";

export type ListSummary = {
  id: string;
  title: string;
  description: string | null;
  ranked: boolean;
  author: {
    id: string;
    username: string;
  };
  itemsCount: number;
  likes: number;
  likedByViewer: boolean;
  createdAt: string;
  updatedAt: string;
  /** The first few games on the list, in list order. */
  previewGames: Pick<GameSummary, "slug" | "title" | "coverUrl">[];
};

export type ListEntry = {
  id: string;
  game: GameSummary;
};

export type ListDetail = ListSummary & {
  entries: ListEntry[];
};

/** One of the viewer's lists, and whether a given game is already on it. */
export type ListChoice = {
  id: string;
  title: string;
  itemsCount: number;
  hasGame: boolean;
};

export type FollowCounts = {
  followers: number;
  following: number;
};

/** A player shown in follower lists, suggestions and notifications. */
export type PlayerLink = {
  id: string;
  username: string;
};

export type ShelfActivity = {
  kind: "played" | "playing" | "backlog" | "rated" | "reviewed";
  id: string;
  player: PlayerLink;
  game: GameSummary;
  rating: number | null;
  review: string | null;
  at: string;
};

export type ListActivity = {
  kind: "list";
  id: string;
  player: PlayerLink;
  list: { id: string; title: string; itemsCount: number };
  at: string;
};

export type ActivityItem = ShelfActivity | ListActivity;

type NotificationBase = {
  id: string;
  actor: PlayerLink;
  createdAt: string;
  read: boolean;
};

export type NotificationItem =
  | (NotificationBase & {
      kind: "follow";
      /** Whether the viewer already follows the player behind the notification. */
      followingBack: boolean;
    })
  | (NotificationBase & {
      kind: "reply" | "review_like";
      /** The viewer's review that got the reply or the like. */
      review: { id: string; gameTitle: string };
    })
  | (NotificationBase & {
      kind: "list_like";
      /** The viewer's list that got the like. */
      list: { id: string; title: string };
    });

export type DiaryEntry = {
  id: string;
  game: GameSummary;
  /** ISO date (YYYY-MM-DD) of the day the game was played. */
  playedOn: string;
  replay: boolean;
  rating: number | null;
  note: string | null;
  createdAt: string;
};

/** How often the viewer has logged a game in their diary. */
export type DiaryPlays = {
  count: number;
  lastPlayedOn: string;
};

export type FriendPlay = {
  player: PlayerLink;
  status: LibraryStatus;
  rating: number | null;
};
