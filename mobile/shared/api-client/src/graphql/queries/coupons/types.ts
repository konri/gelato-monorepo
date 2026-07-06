import { ApolloServerConfig } from '../../types';

export enum CouponDisplayType {
  HOT = 'HOT',
  PROMOTED = 'PROMOTED',
  STANDARD = 'STANDARD'
}

export type PromotedCoupon = {
  id: string;
  code: string;
  title: string;
  distance?: number;
  description: string;
  imageUrl: string;
  displayType: string;
  priority: number;
  couponType: string;
  availability: string;
  pointsCost: number | null;
  validFrom: string;
  validUntil: string;
  discountType: string;
  discountValue: number;
  buyQuantity: number | null;
  getQuantity: number | null;
  thresholdAmount: number | null;
  discountAmount: number | null;
  itemName: string | null;
  dayOfWeek: string | null;
  merchant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    stores: {
      id: string;
      name: string;
      address: string;
      city: string;
      latitude: number;
      longitude: number;
    }[];
  };
};

export type GetPromotedCouponsResponse = {
  promotedCoupons: PromotedCoupon[];
};

export type GetPromotedCouponsOptions = ApolloServerConfig & {
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  cityName?: string;
  radiusKm?: number;
  displayType?: string;
};