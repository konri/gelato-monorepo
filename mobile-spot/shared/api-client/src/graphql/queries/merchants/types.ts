import type { Merchant } from '@repo/types/merchants';
import { ApolloServerConfig } from '../../types';

export type GetMerchantsParams = {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  loadMore?: boolean;
};

export type GetMerchantsResult = {
  items: Merchant[];
  total: number;
};

export type GetMerchantsOptions = ApolloServerConfig & {
  params?: GetMerchantsParams;
};

export type GetMerchantsResponse = {
  getMerchants: Merchant[];
};

export type GetMerchantOptions = ApolloServerConfig & {
  id: string;
};

export type GetMerchantResponse = {
  getMerchant: Merchant;
};
