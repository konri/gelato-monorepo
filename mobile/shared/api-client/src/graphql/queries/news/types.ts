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
};

export type NewsComment = {
  id: string;
  userId: string;
  content: string;
  userName?: string | null;
  userAvatar?: string | null;
  createdAt: string;
};

export type NewsFeedResponse = { newsFeed: NewsItem[] };
export type NewsCommentsResponse = { newsComments: NewsComment[] };
