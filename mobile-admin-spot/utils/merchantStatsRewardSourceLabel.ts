import type { TFunction } from "i18next";

const REWARD_SOURCE_I18N_KEY: Record<string, string> = {
  STAMP_MAIN: "MerchantStats.rewardSourceStampMain",
  STAMP_MILESTONE: "MerchantStats.rewardSourceStampMilestone",
  STREAK: "MerchantStats.rewardSourceStreak",
  COUPON: "MerchantStats.rewardSourceCoupon",
  POINT_VOUCHER: "MerchantStats.rewardSourcePointVoucher",
  MERCHANT_VOUCHER: "MerchantStats.rewardSourceMerchantVoucher",
};

export const merchantStatsRewardSourceLabel = (t: TFunction, sourceKey: string): string => {
  const i18nKey = REWARD_SOURCE_I18N_KEY[sourceKey];
  if (i18nKey !== undefined) {
    return t(i18nKey);
  }
  return sourceKey;
};
