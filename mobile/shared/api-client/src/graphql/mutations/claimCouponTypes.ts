export interface ClaimCouponResponse {
  claimCoupon: {
    id: string;
    qrCode: string;
    isUsed: boolean;
    createdAt: string;
    coupon: {
      id: string;
      code: string;
      title: string;
      description: string;
      imageUrl: string;
      discountType: string;
      discountValue: number;
      validFrom: string;
      validUntil: string;
      merchant: {
        id: string;
        name: string;
        logoUrl: string;
      };
    };
  };
}

export interface ClaimCouponOptions {
  couponId: string;
  token?: string;
}