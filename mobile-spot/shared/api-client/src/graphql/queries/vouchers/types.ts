import { ApolloServerConfig } from '../../types';

export enum VoucherDisplayType {
  HOT = 'HOT',
  PROMOTED = 'PROMOTED',
  STANDARD = 'STANDARD'
}

export type PromotedVoucher = {
  id: string;
  title: string;
  description: string;
  value: number;
  pointsCost: number;
  imageUrl: string;
  priority: number;
  validFrom: string;
  validUntil: string;
  displayType?: string;
  merchant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
  };
  store: {
    id: string;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    logoUrl?: string;
  };
};

export type GetPromotedVouchersResponse = {
  promotedVouchers: PromotedVoucher[];
};

export type GetPromotedVouchersOptions = ApolloServerConfig & {
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  cityName?: string;
  radiusKm?: number;
  displayType?: VoucherDisplayType;
};
