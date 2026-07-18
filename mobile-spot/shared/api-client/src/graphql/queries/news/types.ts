export type NewsAuthorSpot = {
  id: string;
  name: string;
  logoUrl?: string | null;
};

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  publishedAt?: string | null;
  createdAt: string;
  spot?: NewsAuthorSpot | null;
};

export type NewsComment = {
  id: string;
  userId: string;
  parentId?: string | null;
  content: string;
  userName?: string | null;
  userAvatar?: string | null;
  isSpotReply?: boolean;
  createdAt: string;
};

export type SpotNewsItem = {
  id: string;
  title: string;
  description: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  publishedAt?: string | null;
  createdAt: string;
};

export type NewsFeedResponse = { newsFeed: NewsItem[] };
export type NewsCommentsResponse = { newsComments: NewsComment[] };
export type SpotNewsResponse = { spotNews: SpotNewsItem[] };
