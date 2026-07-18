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
  // Authoring spot (null for global/admin news).
  spot?: NewsAuthorSpot | null;
};

export type NewsComment = {
  id: string;
  userId: string;
  parentId?: string | null;
  content: string;
  userName?: string | null;
  userAvatar?: string | null;
  // True when this is an official reply posted as the spot (name+logo above).
  isSpotReply?: boolean;
  createdAt: string;
};

export type NewsFeedResponse = { newsFeed: NewsItem[] };
export type NewsCommentsResponse = { newsComments: NewsComment[] };
