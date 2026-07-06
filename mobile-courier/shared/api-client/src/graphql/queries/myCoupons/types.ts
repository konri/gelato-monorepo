export interface MyCoupon {
  id: string;
  qrCode: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  coupon: {
    id: string;
    code: string;
    title: string;
    description: string;
    imageUrl: string;
    couponType: string;
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
}

export interface MyCouponsResponse {
  myCoupons: MyCoupon[];
}