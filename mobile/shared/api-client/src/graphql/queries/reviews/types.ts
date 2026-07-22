export type PendingReview = {
  orderId: string;
  orderNumber: string;
  spotId: string;
  spotName: string;
  spotLogoUrl?: string | null;
  hasCourier?: boolean | null;
  deliveredAt: string;
};

export type MyReview = {
  id: string;
  spotRating: number;
  courierRating?: number | null;
  overallRating: number;
  comment?: string | null;
};

export type SpotRatingSummary = {
  averageRating?: number | null;
  reviewCount: number;
};

export type PublicReview = {
  id: string;
  rating: number;
  comment?: string | null;
  authorName: string;
  createdAt: string;
};

export type PendingReviewsResponse = { pendingReviews: PendingReview[] };
export type MyReviewResponse = { myReview: MyReview | null };
export type SpotRatingSummaryResponse = { spotRatingSummary: SpotRatingSummary };
export type SpotReviewsResponse = { spotReviews: PublicReview[] };
