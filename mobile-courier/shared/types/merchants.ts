import type { Category } from './category';
import type { Voucher } from './voucher';

export type { Voucher };

export type Store = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
};

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverUrl?: string;
  iconUrl: string;
  category: Category;
  stores: Store[];
  vouchers: Voucher[];
};
