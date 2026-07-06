import { PromotedVoucher } from '@/shared/api-client/src/graphql/queries/vouchers/types';

export const isVoucherActivatable = (voucher: PromotedVoucher): boolean => {
  const now = new Date();
  const validFrom = new Date(voucher.validFrom);
  const validUntil = new Date(voucher.validUntil);
  
  return now >= validFrom && now <= validUntil;
};