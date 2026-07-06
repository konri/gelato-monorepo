export type QRVoucher = {
  id: string;
  title: string;
  qr: string;
  validUntil: string;
  merchant: string;
  date: string;
  time: string;
};
import type { Reward } from './reward';
import type { Store } from './store';
import { Voucher } from './voucher';

export type MerchantDetail = {
  id: string;
  name: string;
  logo: string;
  cover: string;
  description: string;
  stores: Store[];
  vouchers: Voucher[];
  rewards: Reward[];
  myVouchers: QRVoucher[];
  myRewards: QRVoucher[];
  postRewards: QRVoucher[];
};
